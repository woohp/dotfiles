import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { withFileMutationQueue } from "@earendil-works/pi-coding-agent";
import { StringEnum } from "@earendil-works/pi-ai";
import { Text } from "@earendil-works/pi-tui";
import { Type } from "typebox";
import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

type AstKind = "class" | "function";
type Language = "ts" | "tsx" | "js" | "jsx" | "python" | "elixir" | "c" | "cpp";
type SgMatch = {
  text: string;
  file: string;
  range?: {
    byteOffset?: { start: number; end: number };
  };
};

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "ast_replace",
    label: "AST Replace",
    description: "Replace an entire class or function declaration using ast-grep.",
    promptSnippet: "Replace an entire class or function declaration in a file using ast-grep AST matching",
    promptGuidelines: [
      "Use ast_replace when replacing a whole class or function declaration; provide the complete replacement source for that declaration.",
      "Use ast_replace with allowMultiple only when the user explicitly wants every matching declaration replaced.",
    ],
    parameters: Type.Object({
      path: Type.String({ description: "File path to edit, relative to cwd unless absolute. A leading @ is ignored." }),
      kind: StringEnum(["class", "function"] as const),
      name: Type.String({ description: "Class or function declaration name to replace." }),
      replacement: Type.String({ description: "Complete replacement source for the class or function declaration." }),
      language: Type.Optional(StringEnum(["ts", "tsx", "js", "jsx", "python", "elixir", "c", "cpp"] as const)),
      allowMultiple: Type.Optional(Type.Boolean({ description: "Replace all matches instead of erroring on multiple matches." })),
    }),

    async execute(_toolCallId, params, signal, _onUpdate, ctx) {
      await ensureAstGrep(signal);

      const cleanPath = params.path.replace(/^@/, "");
      const absolutePath = resolve(ctx.cwd, cleanPath);
      const language = params.language ?? inferLanguage(cleanPath);
      validateInput(params.kind, params.name, params.replacement, language);

      return withFileMutationQueue(absolutePath, async () => {
        const source = await readFile(absolutePath, "utf8");
        const matches = await findMatches(absolutePath, params.kind, params.name, language, signal);

        if (matches.length === 0) {
          throw new Error(`No ${params.kind} declaration named ${params.name} found in ${cleanPath}`);
        }
        if (matches.length > 1 && !params.allowMultiple) {
          throw new Error(`Found ${matches.length} ${params.kind} declarations named ${params.name} in ${cleanPath}; set allowMultiple=true to replace all of them`);
        }

        const ranges = matches.map(getByteRange).sort((a, b) => b.start - a.start);
        let next = source;
        for (const range of ranges) {
          const replacement = reindentReplacement(params.replacement, getLineIndent(source, range.start));
          next = `${next.slice(0, range.start)}${replacement}${next.slice(range.end)}`;
        }
        await writeFile(absolutePath, next, "utf8");

        const summary = `Replaced ${ranges.length} ${params.kind} declaration${ranges.length === 1 ? "" : "s"} named ${params.name} in ${cleanPath}`;
        return {
          content: [{ type: "text", text: summary }],
          details: { path: cleanPath, kind: params.kind, name: params.name, replacements: ranges.length, ranges: ranges.reverse() },
        };
      });
    },

    renderCall(args, theme) {
      const kind = typeof args.kind === "string" ? args.kind : "node";
      const name = typeof args.name === "string" ? args.name : "?";
      const path = typeof args.path === "string" ? args.path : "?";
      return new Text(theme.fg("toolTitle", theme.bold("ast_replace ")) + theme.fg("muted", `${kind} ${name} in ${path}`), 0, 0);
    },

    renderResult(result, _options, theme, context) {
      const text = result.content[0];
      const msg = text?.type === "text" ? text.text : "";
      const prefix = context?.isError ? theme.fg("error", "✗ ") : theme.fg("success", "✓ ");
      return new Text(prefix + theme.fg("muted", msg), 0, 0);
    },
  });
}

async function ensureAstGrep(signal?: AbortSignal) {
  try {
    await execFileAsync("sg", ["--version"], { signal });
  } catch (error: any) {
    if (error?.code === "ENOENT") throw new Error("ast-grep executable `sg` was not found in PATH");
    throw error;
  }
}

async function findMatches(path: string, kind: AstKind, name: string, language: Language, signal?: AbortSignal): Promise<SgMatch[]> {
  if (language === "cpp" && kind === "function") {
    return findCppFunctionMatches(path, name, signal);
  }

  const pattern = getPattern(kind, name, language);
  const { stdout } = await execFileAsync("sg", ["run", "--json=compact", "--lang", sgLanguage(language), "-p", pattern, path], {
    maxBuffer: 10 * 1024 * 1024,
    signal,
  });
  const trimmed = stdout.trim();
  if (!trimmed) return [];
  return JSON.parse(trimmed) as SgMatch[];
}

async function findCppFunctionMatches(path: string, name: string, signal?: AbortSignal): Promise<SgMatch[]> {
  const { stdout } = await execFileAsync("sg", ["run", "--json=compact", "--lang", "cpp", "--kind", "function_definition", path], {
    maxBuffer: 10 * 1024 * 1024,
    signal,
  });
  const trimmed = stdout.trim();
  if (!trimmed) return [];

  const matches = JSON.parse(trimmed) as SgMatch[];
  const declaration = new RegExp(`(?:^|[^A-Za-z_$\\w])${escapeRegExp(name)}\\s*\\(`);
  return matches.filter((match) => declaration.test(match.text));
}

function validateInput(kind: AstKind, name: string, replacement: string, language: Language) {
  if (!IDENTIFIER.test(name)) throw new Error(`Invalid ${kind} name: ${name}`);
  if (!replacement.trim()) throw new Error("replacement must not be empty");
  getPattern(kind, name, language);
}

function getPattern(kind: AstKind, name: string, language: Language): string {
  if (language === "python") {
    return kind === "class" ? `class ${name}:\n    $$$BODY` : `def ${name}($$$ARGS):\n    $$$BODY`;
  }
  if (language === "elixir") {
    return kind === "class" ? `defmodule ${name} do\n  $$$BODY\nend` : `def ${name}($$$ARGS) do\n  $$$BODY\nend`;
  }
  if (language === "c") {
    if (kind === "class") throw new Error("C does not support class declarations");
    return `$$$RET ${name}($$$ARGS) { $$$BODY }`;
  }
  if (language === "cpp") {
    return kind === "class" ? `class ${name} { public: $$$BODY }` : `$$$RET ${name}($$$ARGS) { $$$BODY }`;
  }
  return kind === "class" ? `class ${name} $$$BODY` : `function ${name}($$$ARGS) { $$$BODY }`;
}

function inferLanguage(path: string): Language {
  if (path.endsWith(".tsx")) return "tsx";
  if (path.endsWith(".ts")) return "ts";
  if (path.endsWith(".jsx")) return "jsx";
  if (path.endsWith(".js")) return "js";
  if (path.endsWith(".py")) return "python";
  if (path.endsWith(".ex") || path.endsWith(".exs")) return "elixir";
  if (path.endsWith(".c") || path.endsWith(".h")) return "c";
  if (path.endsWith(".cc") || path.endsWith(".cpp") || path.endsWith(".cxx") || path.endsWith(".hh") || path.endsWith(".hpp") || path.endsWith(".hxx")) return "cpp";
  throw new Error("Unsupported language; pass language as one of ts, tsx, js, jsx, python, elixir, c, cpp");
}

function sgLanguage(language: Language): string {
  if (language === "python") return "python";
  if (language === "elixir") return "elixir";
  if (language === "c") return "c";
  if (language === "cpp") return "cpp";
  if (language === "tsx") return "tsx";
  if (language === "jsx") return "jsx";
  return language;
}

function getByteRange(match: SgMatch): { start: number; end: number } {
  const range = match.range?.byteOffset;
  if (!range || !Number.isInteger(range.start) || !Number.isInteger(range.end)) {
    throw new Error("ast-grep did not return byte offsets for a match");
  }
  return { start: range.start, end: range.end };
}

function getLineIndent(source: string, offset: number): string {
  const lineStart = source.lastIndexOf("\n", offset - 1) + 1;
  const prefix = source.slice(lineStart, offset);
  const match = prefix.match(/^[\t ]*$/);
  return match ? prefix : "";
}

function reindentReplacement(replacement: string, indent: string): string {
  const normalized = stripReplacementBaseIndent(replacement.trimEnd());
  const lines = normalized.split("\n");
  return lines.map((line) => (line.length === 0 ? line : `${indent}${line}`)).join("\n");
}

function stripReplacementBaseIndent(text: string): string {
  const lines = text.replace(/^\n+/, "").split("\n");
  const firstNonEmpty = lines.find((line) => line.trim().length > 0);
  const baseIndent = firstNonEmpty?.match(/^[\t ]*/)?.[0] ?? "";

  if (!baseIndent) return lines.join("\n");

  return lines.map((line) => (line.startsWith(baseIndent) ? line.slice(baseIndent.length) : line)).join("\n");
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
