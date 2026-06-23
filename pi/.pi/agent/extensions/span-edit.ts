import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { withFileMutationQueue } from "@earendil-works/pi-coding-agent";
import { StringEnum } from "@earendil-works/pi-ai";
import { Text } from "@earendil-works/pi-tui";
import { Type } from "typebox";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

type Operation = "replace" | "insert_before" | "insert_after";

type SpanEditParams = {
  path: string;
  line?: number;
  first_line?: number;
  op: Operation;
  start: string;
  end?: string;
  content: string;
  include_bounds?: boolean;
  dry_run?: boolean;
};

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "span_edit",
    label: "Span Edit",
    description: "Token-efficient exact text editing by line-scoped literal anchors. Replaces a span between start/end anchors or inserts before/after an anchor. Anchors and content may be multiline.",
    promptSnippet: "Edit prose or long-line text by line-scoped literal anchors without restating an entire line or paragraph",
    promptGuidelines: [
      "Use span_edit for prose or long-line text edits where built-in edit would require restating a huge line or paragraph.",
      "span_edit requires exactly one of line or first_line: line scopes the start anchor to that exact line; first_line uses the first start anchor from that line onward.",
      "For span_edit replace, provide literal start and end anchors plus replacement content; anchors and content may be multiline. By default the replacement includes both anchors, so content should contain the desired full replacement span.",
      "Use span_edit insert_before or insert_after to add text at an anchor; include any desired leading/trailing newlines in content explicitly."
    ],
    parameters: Type.Object({
      path: Type.String({ description: "File path to edit, relative to cwd unless absolute. A leading @ is ignored." }),
      line: Type.Optional(Type.Number({ description: "1-indexed line number. The start anchor must begin on this exact line; ambiguous multiple starts on the line fail." })),
      first_line: Type.Optional(Type.Number({ description: "1-indexed line number. Use the first start anchor found from this line onward." })),
      op: StringEnum(["replace", "insert_before", "insert_after"] as const),
      start: Type.String({ description: "Literal start/anchor text. May be multiline." }),
      end: Type.Optional(Type.String({ description: "Literal end text for replace. May be multiline and may appear on a later line." })),
      content: Type.String({ description: "Replacement or insertion content. May be multiline. Newlines are used exactly as provided." }),
      include_bounds: Type.Optional(Type.Boolean({ description: "For replace only. If true (default), replace from the beginning of start through the end of end. If false, keep start and end and replace only the text between them." })),
      dry_run: Type.Optional(Type.Boolean({ description: "If true, report what would change without writing the file." })),
    }),

    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      validateParams(params);

      const cleanPath = params.path.replace(/^@/, "");
      const absolutePath = resolve(ctx.cwd, cleanPath);

      return withFileMutationQueue(absolutePath, async () => {
        const source = await readFile(absolutePath, "utf8");
        const edit = computeEdit(source, params);
        const next = source.slice(0, edit.from) + params.content + source.slice(edit.to);

        if (!params.dry_run) {
          await writeFile(absolutePath, next, "utf8");
        }

        const action = params.dry_run ? "Would update" : "Updated";
        const summary = `${action} ${cleanPath}: ${params.op} at line ${edit.line}, replaced ${edit.to - edit.from} chars with ${params.content.length} chars`;
        return {
          content: [{ type: "text", text: summary }],
          details: {
            path: cleanPath,
            operation: params.op,
            dry_run: !!params.dry_run,
            line: edit.line,
            start_offset: edit.startIndex,
            replaced_chars: edit.to - edit.from,
            replacement_chars: params.content.length,
            preview: makePreview(source, edit.from, edit.to),
          },
        };
      });
    },

    renderCall(args, theme) {
      const op = typeof args.op === "string" ? args.op : "edit";
      const path = typeof args.path === "string" ? args.path : "?";
      const line = typeof args.line === "number" ? `line ${args.line}` : typeof args.first_line === "number" ? `from line ${args.first_line}` : "line ?";
      return new Text(theme.fg("toolTitle", theme.bold("span_edit ")) + theme.fg("muted", `${op} ${path} ${line}`), 0, 0);
    },

    renderResult(result, _options, theme, context) {
      const text = result.content[0];
      const msg = text?.type === "text" ? text.text : "";
      const prefix = context?.isError ? theme.fg("error", "✗ ") : theme.fg("success", "✓ ");
      return new Text(prefix + theme.fg("muted", msg), 0, 0);
    },
  });
}

function validateParams(params: SpanEditParams) {
  const hasLine = params.line !== undefined;
  const hasFirstLine = params.first_line !== undefined;
  if (hasLine === hasFirstLine) throw new Error("Provide exactly one of line or first_line");
  if (hasLine && (!Number.isInteger(params.line) || params.line! < 1)) throw new Error("line must be a positive integer");
  if (hasFirstLine && (!Number.isInteger(params.first_line) || params.first_line! < 1)) throw new Error("first_line must be a positive integer");
  if (!params.start) throw new Error("start must be non-empty");
  if (params.op === "replace" && !params.end) throw new Error("replace requires non-empty end");
  if (params.op !== "replace" && params.end !== undefined) throw new Error(`${params.op} does not use end`);
}

function computeEdit(source: string, params: SpanEditParams) {
  const lineStarts = getLineStarts(source);
  const scopeLine = params.line ?? params.first_line!;
  if (scopeLine > lineStarts.length) throw new Error(`Line ${scopeLine} is past end of file (${lineStarts.length} lines)`);

  const startIndex = params.line !== undefined
    ? findUniqueStartOnLine(source, params.start, lineStarts, params.line)
    : findFirstStartFromLine(source, params.start, lineStarts, params.first_line!);

  if (params.op === "insert_before") {
    return { from: startIndex, to: startIndex, startIndex, line: lineOfIndex(lineStarts, startIndex) };
  }
  if (params.op === "insert_after") {
    const pos = startIndex + params.start.length;
    return { from: pos, to: pos, startIndex, line: lineOfIndex(lineStarts, startIndex) };
  }

  const end = params.end!;
  const endIndex = source.startsWith(end, startIndex) ? startIndex : source.indexOf(end, startIndex + params.start.length);
  if (endIndex === -1) throw new Error("No end anchor found after the selected start anchor");

  const includeBounds = params.include_bounds ?? true;
  const from = includeBounds ? startIndex : startIndex + params.start.length;
  const to = includeBounds ? endIndex + end.length : endIndex;
  if (to < from) throw new Error("Invalid replacement range; end anchor occurs before start anchor finishes");
  return { from, to, startIndex, line: lineOfIndex(lineStarts, startIndex) };
}

function findUniqueStartOnLine(source: string, start: string, lineStarts: number[], line: number) {
  const from = lineStarts[line - 1];
  const to = line < lineStarts.length ? lineStarts[line] : source.length + 1;
  const matches = findOccurrences(source, start, from).filter((index) => index < to);
  if (matches.length === 0) throw new Error(`No start anchor found beginning on line ${line}`);
  if (matches.length > 1) throw new Error(`Ambiguous start anchor: found ${matches.length} matches beginning on line ${line}`);
  return matches[0];
}

function findFirstStartFromLine(source: string, start: string, lineStarts: number[], firstLine: number) {
  const from = lineStarts[firstLine - 1];
  const index = source.indexOf(start, from);
  if (index === -1) throw new Error(`No start anchor found from line ${firstLine} onward`);
  return index;
}

function findOccurrences(source: string, needle: string, from: number) {
  const matches: number[] = [];
  let index = source.indexOf(needle, from);
  while (index !== -1) {
    matches.push(index);
    index = source.indexOf(needle, index + Math.max(needle.length, 1));
  }
  return matches;
}

function getLineStarts(source: string) {
  const starts = [0];
  for (let i = 0; i < source.length; i++) {
    if (source[i] === "\n" && i + 1 < source.length) starts.push(i + 1);
  }
  return starts;
}

function lineOfIndex(lineStarts: number[], index: number) {
  let low = 0;
  let high = lineStarts.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (lineStarts[mid] <= index) low = mid + 1;
    else high = mid - 1;
  }
  return high + 1;
}

function makePreview(source: string, from: number, to: number) {
  const context = 80;
  return {
    before: source.slice(Math.max(0, from - context), from),
    replaced: source.slice(from, to),
    after: source.slice(to, Math.min(source.length, to + context)),
  };
}
