import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { createLocalBashOperations } from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";
import { Type } from "typebox";

const DEFAULT_HISTORY_LIMIT = 10;
const MAX_HISTORY = 100;
const MAX_OUTPUT_BYTES = 50 * 1024;

type BashRecord = {
  id: string;
  command: string;
  cwd: string;
  source: "bash" | "user_bash" | "bash_again";
  timestamp: number;
};

type TextPart = { type: "text"; text: string };

export default function (pi: ExtensionAPI) {
  let records: BashRecord[] = [];
  let nextId = 1;
  const operations = createLocalBashOperations();

  function save(command: string, cwd: string, source: BashRecord["source"]): BashRecord {
    const record = { id: `b${nextId++}`, command, cwd, source, timestamp: Date.now() };
    records.push(record);
    if (records.length > MAX_HISTORY) records = records.slice(-MAX_HISTORY);
    return record;
  }

  pi.on("tool_result", async (event, ctx) => {
    if (event.toolName !== "bash") return;

    const input = event.input as { command?: unknown } | undefined;
    if (typeof input?.command !== "string") return;

    const record = save(input.command, ctx.cwd, "bash");
    return appendRefToResult(event.content, record.id);
  });

  pi.on("user_bash", (event) => {
    save(event.command, event.cwd, "user_bash");
  });

  pi.registerTool({
    name: "bash_again",
    label: "Bash Again",
    description: "Re-run a previous bash command by ref, or by negative index where -1 is the previous command, -2 is the command before that, etc.",
    promptSnippet: "Re-run a previous bash command by ref or negative index",
    promptGuidelines: [
      "Use bash_again to re-run an earlier bash command by ref like b3, or by negative index like -1 for the previous bash command.",
      "bash_again always returns the saved ref for the command it re-ran.",
      "Each bash_again execution is saved as a new history entry, so after bash_again -1, -1 refers to that rerun, -2 to the command it reran, and earlier commands shift back.",
    ],
    parameters: Type.Object({
      ref: Type.Union([Type.String(), Type.Number()], {
        description: "Command ref such as b3, or a negative integer: -1 is previous command, -2 is the command before that. bash_again reruns are saved as new history entries, so negative indexes shift after each rerun.",
      }),
      timeout: Type.Optional(Type.Number({ description: "Timeout in seconds (optional, no default timeout)." })),
    }),
    async execute(_toolCallId, params, signal) {
      const record = resolveRef(params.ref, records);
      const output = new OutputBuffer();
      let exitCode: number | null = null;

      try {
        const result = await operations.exec(record.command, record.cwd, {
          onData: (data) => output.append(data),
          signal,
          timeout: params.timeout,
        });
        exitCode = result.exitCode;
      } catch (error) {
        const rerun = save(record.command, record.cwd, "bash_again");
        const text = formatAgainOutput(record, rerun, output.text(), error instanceof Error ? error.message : String(error));
        throw new Error(text);
      }

      const rerun = save(record.command, record.cwd, "bash_again");
      const status = exitCode === 0 || exitCode === null ? undefined : `Command exited with code ${exitCode}`;
      if (status) throw new Error(formatAgainOutput(record, rerun, output.text(), status));

      const text = formatAgainOutput(record, rerun, output.text());
      return {
        content: [{ type: "text", text }],
        details: { ref: rerun.id, reran: record.id, command: record.command, cwd: record.cwd, exitCode },
      };
    },
    renderCall(args, theme) {
      const ref = typeof args.ref === "string" || typeof args.ref === "number" ? String(args.ref) : "?";
      return new Text(theme.fg("toolTitle", theme.bold("bash_again ")) + theme.fg("muted", ref), 0, 0);
    },
  });

  pi.registerTool({
    name: "bash_history",
    label: "Bash History",
    description: "List recent bash command refs available for bash_again.",
    promptSnippet: "List recent bash command refs available for bash_again",
    promptGuidelines: ["Use bash_history when you need to discover refs for previous bash commands before calling bash_again."],
    parameters: Type.Object({
      limit: Type.Optional(Type.Number({ description: `Number of recent commands to show. Default: ${DEFAULT_HISTORY_LIMIT}.` })),
    }),
    async execute(_toolCallId, params) {
      const limit = clampLimit(params.limit);
      const recent = records.slice(-limit).reverse();
      const text = recent.length === 0 ? "No bash command history." : recent.map(formatHistoryRecord).join("\n");
      return { content: [{ type: "text", text }], details: { records: recent } };
    },
  });
}

function appendRefToResult(content: any, ref: string) {
  const parts = Array.isArray(content) ? [...content] : [];
  const lastTextIndex = findLastTextPart(parts);
  const suffix = `\n\n[bash ref: ${ref}]`;

  if (lastTextIndex === -1) {
    parts.push({ type: "text", text: `[bash ref: ${ref}]` });
  } else {
    const part = parts[lastTextIndex] as TextPart;
    parts[lastTextIndex] = { ...part, text: `${part.text}${suffix}` };
  }

  return { content: parts };
}

function findLastTextPart(parts: any[]): number {
  for (let i = parts.length - 1; i >= 0; i--) {
    if (parts[i]?.type === "text" && typeof parts[i].text === "string") return i;
  }
  return -1;
}

function resolveRef(ref: string | number, records: BashRecord[]): BashRecord {
  if (typeof ref === "number") return resolveNegativeIndex(ref, records);

  const trimmed = ref.trim();
  if (/^-\d+$/.test(trimmed)) return resolveNegativeIndex(Number(trimmed), records);

  const record = records.find((item) => item.id === trimmed);
  if (!record) throw new Error(`No bash command found for ref ${trimmed}`);
  return record;
}

function resolveNegativeIndex(index: number, records: BashRecord[]): BashRecord {
  if (!Number.isInteger(index) || index >= 0) throw new Error("Negative refs must be integers like -1, -2, etc.");
  const record = records[records.length + index];
  if (!record) throw new Error(`No bash command found for ref ${index}`);
  return record;
}

function formatAgainOutput(original: BashRecord, rerun: BashRecord, output: string, status?: string): string {
  const header = `[bash_again ref: ${rerun.id}; reran: ${original.id}]\n$ ${original.command}`;
  const body = output || "(no output)";
  return status ? `${header}\n\n${body}\n\n${status}` : `${header}\n\n${body}`;
}

function formatHistoryRecord(record: BashRecord): string {
  const age = new Date(record.timestamp).toLocaleTimeString();
  return `${record.id} ${record.source} cwd=${record.cwd} at ${age}: ${truncateLine(record.command, 160)}`;
}

function clampLimit(limit: number | undefined): number {
  if (limit === undefined) return DEFAULT_HISTORY_LIMIT;
  if (!Number.isFinite(limit)) return DEFAULT_HISTORY_LIMIT;
  return Math.max(1, Math.min(MAX_HISTORY, Math.floor(limit)));
}

function truncateLine(text: string, max: number): string {
  const oneLine = text.replace(/\s+/g, " ").trim();
  return oneLine.length > max ? `${oneLine.slice(0, max - 1)}…` : oneLine;
}

class OutputBuffer {
  private chunks: Buffer[] = [];
  private bytes = 0;
  private truncated = false;

  append(data: Buffer) {
    if (this.bytes >= MAX_OUTPUT_BYTES) {
      this.truncated = true;
      return;
    }

    const remaining = MAX_OUTPUT_BYTES - this.bytes;
    const chunk = data.length > remaining ? data.subarray(0, remaining) : data;
    this.chunks.push(chunk);
    this.bytes += chunk.length;
    if (data.length > remaining) this.truncated = true;
  }

  text(): string {
    const text = Buffer.concat(this.chunks).toString("utf8").trimEnd();
    return this.truncated ? `${text}\n\n[Output truncated by bash_again at ${MAX_OUTPUT_BYTES} bytes]` : text;
  }
}
