import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { withFileMutationQueue } from "@earendil-works/pi-coding-agent";
import { StringEnum } from "@earendil-works/pi-ai";
import { Text } from "@earendil-works/pi-tui";
import { Type } from "typebox";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";

type Operation = "replace" | "insert_before" | "insert_after";

type SpanEditParams = {
  path: string;
  line?: number;
  first_line?: number;
  op: Operation;
  start: string;
  end?: string;
  content?: string;
  content_path?: string;
  include_bounds?: boolean;
  dry_run?: boolean;
};

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "span_edit",
    label: "Span Edit",
    description: "Token-efficient exact text editing by line-scoped literal anchors. Replaces a span between start/end anchors, replaces an exact start anchor when end is omitted, or inserts before/after an anchor. Anchors and content may be multiline.",
    promptSnippet: "Edit prose or long-line text by line-scoped literal anchors without restating an entire line or paragraph",
    promptGuidelines: [
      "Use span_edit for prose or long-line text edits where built-in edit would require restating a huge line or paragraph.",
      "span_edit requires exactly one of line or first_line: line scopes the start anchor to that exact line; first_line uses the first start anchor from that line onward.",
      "For span_edit replace, provide literal start and optional end anchors plus replacement content. If end is omitted, replace the exact start anchor only. If end is provided, the replacement includes both anchors by default, so content should contain the desired full replacement span.",
      "Use span_edit insert_before or insert_after to add text at an anchor; include any desired leading/trailing newlines in content explicitly.",
      "Provide exactly one of content or content_path. If a call fails after content is available, span_edit saves that content to a temp file; retry with content_path pointing to that file after adjusting anchors or line scope.",
      "Efficiency guidance: use the shortest stable start/end anchors that uniquely identify the intended span. first_line can be approximate, even 1, if the anchor is unique; use exact line when constraining to a specific line matters. Prefer semantic anchors like headings, labels, function names, or config keys over common words. Use include_bounds: false to preserve anchors and edit only the interior. Use dry_run: true for risky or uncertain edits."
    ],
    parameters: Type.Object({
      path: Type.String({ description: "File path to edit, relative to cwd unless absolute. A leading @ is ignored." }),
      line: Type.Optional(Type.Number({ description: "1-indexed line number. The start anchor must begin on this exact line; ambiguous multiple starts on the line fail." })),
      first_line: Type.Optional(Type.Number({ description: "1-indexed line number. Use the first start anchor found from this line onward." })),
      op: StringEnum(["replace", "insert_before", "insert_after"] as const),
      start: Type.String({ description: "Literal start/anchor text. May be multiline." }),
      end: Type.Optional(Type.String({ description: "Literal end text for replace. May be multiline and may appear on a later line." })),
      content: Type.Optional(Type.String({ description: "Replacement or insertion content. May be multiline. Newlines are used exactly as provided. Provide exactly one of content or content_path." })),
      content_path: Type.Optional(Type.String({ description: "Path to a file containing replacement or insertion content. Relative paths are resolved from cwd. Provide exactly one of content or content_path." })),
      include_bounds: Type.Optional(Type.Boolean({ description: "For replace with end only. If true (default), replace from the beginning of start through the end of end. If false, keep start and end and replace only the text between them. Ignored when replace omits end." })),
      dry_run: Type.Optional(Type.Boolean({ description: "If true, report what would change without writing the file." })),
    }),

    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      validateParams(params);

      const cleanPath = params.path.replace(/^@/, "");
      const absolutePath = resolve(ctx.cwd, cleanPath);
      const content = await resolveContent(params, ctx.cwd);

      try {
        return await withFileMutationQueue(absolutePath, async () => {
          const source = await readFile(absolutePath, "utf8");
          const edit = computeEdit(source, params);
          const next = source.slice(0, edit.from) + content + source.slice(edit.to);

          if (!params.dry_run) {
            await writeFile(absolutePath, next, "utf8");
          }

          const action = params.dry_run ? "Would update" : "Updated";
          const summary = `${action} ${cleanPath}: ${params.op} at line ${edit.line}, replaced ${edit.to - edit.from} chars with ${content.length} chars`;
          return {
            content: [{ type: "text", text: summary }],
            details: {
              path: cleanPath,
              operation: params.op,
              dry_run: !!params.dry_run,
              line: edit.line,
              start_offset: edit.startIndex,
              replaced_chars: edit.to - edit.from,
              replacement_chars: content.length,
              preview: makePreview(source, edit.from, edit.to),
            },
          };
        });
      } catch (error) {
        throw new Error(await makeRetryableError(error, content));
      }
    },

    renderCall(args, theme, context) {
      const op = typeof args.op === "string" ? args.op : "edit";
      const path = typeof args.path === "string" ? args.path : "?";
      const line = typeof args.line === "number" ? `line ${args.line}` : typeof args.first_line === "number" ? `from line ${args.first_line}` : "line ?";
      let text = theme.fg("toolTitle", theme.bold("span_edit ")) + theme.fg("muted", `${op} ${path} ${line}`);

      if (context?.expanded) {
        text += renderExpandedArgs(args, theme);
      }

      return new Text(text, 0, 0);
    },

    renderResult(result, options, theme, context) {
      const content = result.content[0];
      const msg = content?.type === "text" ? content.text : "";
      const prefix = context?.isError ? theme.fg("error", "✗ ") : theme.fg("success", "✓ ");
      let text = prefix + theme.fg("muted", msg);

      if (options.expanded) {
        text += renderExpandedResult(result, theme);
      }

      return new Text(text, 0, 0);
    },
  });
}

function renderExpandedArgs(args: Record<string, unknown>, theme: any) {
  const lines = [""];
  appendArg(lines, "start", args.start);
  appendArg(lines, "end", args.end);
  appendArg(lines, "content", args.content);
  appendArg(lines, "content_path", args.content_path);
  appendArg(lines, "include_bounds", args.include_bounds);
  appendArg(lines, "dry_run", args.dry_run);
  return "\n" + theme.fg("muted", lines.join("\n"));
}

function renderExpandedResult(result: any, theme: any) {
  const details = result.details;
  if (!details?.preview) return "";

  const lines = [
    "",
    "preview before:",
    details.preview.before,
    "",
    "replaced:",
    details.preview.replaced,
    "",
    "preview after:",
    details.preview.after,
  ];
  return "\n" + theme.fg("muted", lines.join("\n"));
}

function appendArg(lines: string[], name: string, value: unknown) {
  if (value === undefined) return;
  lines.push(`${name}:`);
  lines.push(typeof value === "string" ? value : String(value));
  lines.push("");
}

function resolveContent(params: SpanEditParams, cwd: string) {
  const hasContent = params.content !== undefined;
  const hasContentPath = params.content_path !== undefined;
  if (hasContent === hasContentPath) throw new Error("Provide exactly one of content or content_path");
  if (hasContent) return params.content!;

  const cleanPath = params.content_path!.replace(/^@/, "");
  return readFile(resolve(cwd, cleanPath), "utf8");
}

async function makeRetryableError(error: unknown, content: string) {
  const tempRoot = existsSync("/tmp") ? "/tmp" : tmpdir();
  const contentPath = resolve(tempRoot, `se-${randomUUID().slice(0, 10)}.txt`);
  await writeFile(contentPath, content, "utf8");
  const message = error instanceof Error ? error.message : String(error);
  return `${message}\n\nThe requested content was saved to:\n${contentPath}\n\nRetry span_edit with content_path set to that file, and adjust line/first_line or anchors. An incorrect start line is a common cause of span_edit failures.`;
}

function validateParams(params: SpanEditParams) {
  const hasLine = params.line !== undefined;
  const hasFirstLine = params.first_line !== undefined;
  if (hasLine === hasFirstLine) throw new Error("Provide exactly one of line or first_line");
  if (hasLine && (!Number.isInteger(params.line) || params.line! < 1)) throw new Error("line must be a positive integer");
  if (hasFirstLine && (!Number.isInteger(params.first_line) || params.first_line! < 1)) throw new Error("first_line must be a positive integer");
  if (!params.start) throw new Error("start must be non-empty");
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

  if (params.end === undefined) {
    return { from: startIndex, to: startIndex + params.start.length, startIndex, line: lineOfIndex(lineStarts, startIndex) };
  }

  const end = params.end;
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
