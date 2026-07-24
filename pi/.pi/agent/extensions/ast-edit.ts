import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { withFileMutationQueue } from "@earendil-works/pi-coding-agent";
import { StringEnum } from "@earendil-works/pi-ai";
import { Text } from "@earendil-works/pi-tui";
import { Type } from "typebox";
import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

type AstKind = "class" | "function";
type Language = "ts" | "tsx" | "js" | "jsx" | "python" | "elixir" | "c" | "cpp" | "rust";
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
    description: "Replace one whole named class, function, method, module, or struct.",
    promptSnippet: "Replace a whole named class, function, method, module, or struct in a file using ast-grep AST matching",
    promptGuidelines: [
      "Named targets only. No anonymous nodes.",
      "Provide exactly one of replacement or replacement_path.",
      "If replacement fails, its content is saved to a temp file. Retry with replacement_path.",
      "kind=class includes Elixir defmodule and Rust struct. C has no class.",
      "Use allowMultiple only when all same-name matches should change.",
    ],
    parameters: Type.Object({
      path: Type.String({ description: "File path to edit, relative to cwd unless absolute. A leading @ is ignored." }),
      kind: StringEnum(["class", "function"] as const),
      name: Type.String({ description: "Target name." }),
      replacement: Type.Optional(Type.String({ description: "Whole replacement node. Provide exactly one of replacement or replacement_path." })),
      replacement_path: Type.Optional(Type.String({ description: "Path to a file containing the whole replacement node. Relative paths resolve from cwd. Provide exactly one of replacement or replacement_path." })),
      language: Type.Optional(StringEnum(["ts", "tsx", "js", "jsx", "python", "elixir", "c", "cpp", "rust"] as const)),
      allowMultiple: Type.Optional(Type.Boolean({ description: "Replace all matches instead of erroring on multiple matches." })),
    }),

    async execute(_toolCallId, params, signal, _onUpdate, ctx) {
      const replacement = await resolveReplacement(params, ctx.cwd);

      try {
        await ensureAstGrep(signal);

        const cleanPath = params.path.replace(/^@/, "");
        const absolutePath = resolve(ctx.cwd, cleanPath);
        const language = params.language ?? inferLanguage(cleanPath);
        validateInput(params.kind, params.name, replacement, language);

        return await withFileMutationQueue(absolutePath, async () => {
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
            const reindented = reindentReplacement(replacement, getLineIndent(source, range.start));
            next = `${next.slice(0, range.start)}${reindented}${next.slice(range.end)}`;
          }
          await writeFile(absolutePath, next, "utf8");

          const summary = `Replaced ${ranges.length} ${params.kind} declaration${ranges.length === 1 ? "" : "s"} named ${params.name} in ${cleanPath}`;
          return {
            content: [{ type: "text", text: summary }],
            details: { path: cleanPath, kind: params.kind, name: params.name, replacements: ranges.length, ranges: ranges.reverse() },
          };
        });
      } catch (error) {
        throw new Error(await makeRetryableError(error, replacement));
      }
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
    await execFileAsync(astGrepExecutable(), ["--version"], { signal });
  } catch (error: any) {
    if (error?.code === "ENOENT") throw new Error(`ast-grep executable \`${astGrepExecutable()}\` was not found in PATH`);
    throw error;
  }
}

async function findMatches(path: string, kind: AstKind, name: string, language: Language, signal?: AbortSignal): Promise<SgMatch[]> {
  if (isJavaScriptLike(language)) {
    return findJavaScriptLikeMatches(path, kind, name, language, signal);
  }
  if (language === "cpp" && kind === "function") {
    return findNamedKindMatches(path, "cpp", "function_definition", name, signal);
  }
  if (language === "rust" && kind === "function") {
    return findNamedKindMatches(path, "rust", "function_item", name, signal);
  }

  const pattern = getPattern(kind, name, language);
  const stdout = await runAstGrep(["run", "--json=compact", "--lang", sgLanguage(language), "-p", pattern, path], signal);
  const trimmed = stdout.trim();
  if (!trimmed) return [];
  return JSON.parse(trimmed) as SgMatch[];
}

async function findJavaScriptLikeMatches(path: string, kind: AstKind, name: string, language: Language, signal?: AbortSignal): Promise<SgMatch[]> {
  const nodeKinds = kind === "class" ? ["class_declaration", "abstract_class_declaration", "lexical_declaration"] : ["function_declaration", "generator_function_declaration", "lexical_declaration", "method_definition"];
  const [exports, ...declarationGroups] = await Promise.all([
    findKindMatches(path, language, "export_statement", signal),
    ...nodeKinds.map((nodeKind) => findKindMatches(path, language, nodeKind, signal)),
  ]);
  const namedExports = exports.filter((match) => jsLikeDeclarationRegex(kind, name).test(match.text));
  const exportRanges = namedExports.map(getByteRange);
  const namedDeclarations = declarationGroups.flat().filter((match) => jsLikeDeclarationRegex(kind, name).test(match.text));
  const unexportedDeclarations = namedDeclarations.filter((match) => !isInsideAnyRange(getByteRange(match), exportRanges));
  return [...namedExports, ...unexportedDeclarations];
}

async function findNamedKindMatches(path: string, language: Language, nodeKind: string, name: string, signal?: AbortSignal): Promise<SgMatch[]> {
  const matches = await findKindMatches(path, language, nodeKind, signal);
  const declaration = new RegExp(`(?:^|[^A-Za-z_$\\w])${escapeRegExp(name)}\\s*\\(`);
  return matches.filter((match) => declaration.test(match.text));
}

async function findKindMatches(path: string, language: Language, nodeKind: string, signal?: AbortSignal): Promise<SgMatch[]> {
  const stdout = await runAstGrep(["run", "--json=compact", "--lang", sgLanguage(language), "--kind", nodeKind, path], signal);
  const trimmed = stdout.trim();
  return trimmed ? (JSON.parse(trimmed) as SgMatch[]) : [];
}

async function resolveReplacement(params: { replacement?: string; replacement_path?: string }, cwd: string): Promise<string> {
  const hasReplacement = params.replacement !== undefined;
  const hasReplacementPath = params.replacement_path !== undefined;
  if (hasReplacement === hasReplacementPath) throw new Error("Provide exactly one of replacement or replacement_path");
  if (hasReplacement) return params.replacement!;

  const cleanPath = params.replacement_path!.replace(/^@/, "");
  return readFile(resolve(cwd, cleanPath), "utf8");
}

async function makeRetryableError(error: unknown, replacement: string): Promise<string> {
  const tempRoot = existsSync("/tmp") ? "/tmp" : tmpdir();
  const replacementPath = resolve(tempRoot, `ast-replace-${randomUUID().slice(0, 10)}.txt`);
  await writeFile(replacementPath, replacement, "utf8");
  const message = error instanceof Error ? error.message : String(error);
  return `${message}\n\nThe replacement was saved to:\n${replacementPath}\n\nRetry ast_replace with replacement_path set to that file.`;
}

function validateInput(kind: AstKind, name: string, replacement: string, language: Language) {
  if (!IDENTIFIER.test(name)) throw new Error(`Invalid ${kind} name: ${name}`);
  if (!replacement.trim()) throw new Error("replacement must not be empty");
  getPattern(kind, name, language);
}

async function runAstGrep(args: string[], signal?: AbortSignal): Promise<string> {
  try {
    const { stdout } = await execFileAsync(astGrepExecutable(), args, {
      maxBuffer: 10 * 1024 * 1024,
      signal,
    });
    return stdout;
  } catch (error: any) {
    if (error?.code === 1 && typeof error.stdout === "string") return error.stdout;
    throw error;
  }
}

function getPattern(kind: AstKind, name: string, language: Language): string {
  if (language === "python") {
    return kind === "class" ? `class ${name}` : `def ${name}`;
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
  if (language === "rust") {
    return kind === "class" ? `struct ${name} { $$$BODY }` : `fn ${name}($$$ARGS) { $$$BODY }`;
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
  if (path.endsWith(".rs")) return "rust";
  throw new Error("Unsupported language; pass language as one of ts, tsx, js, jsx, python, elixir, c, cpp, rust");
}

function astGrepExecutable(): string {
  return process.platform === "linux" ? "ast-grep" : "sg";
}

function isJavaScriptLike(language: Language): boolean {
  return language === "ts" || language === "tsx" || language === "js" || language === "jsx";
}

function jsLikeDeclarationRegex(kind: AstKind, name: string): RegExp {
  const escapedName = escapeRegExp(name);
  if (kind === "class") {
    return new RegExp(`(?:\\b(?:abstract\\s+)?class\\s+${escapedName}\\b|\\b${escapedName}\\s*=\\s*class\\b)`);
  }
  return new RegExp(`(?:\\b(?:async\\s+)?function\\s*\\*?\\s+${escapedName}\\b|\\b${escapedName}\\s*=\\s*(?:async\\s+)?(?:function\\b|(?:\\([^)]*\\)|[A-Za-z_$][\\w$]*)\\s*=>)|(?:^|\\s)(?:static\\s+|async\\s+|\\*\\s*)*${escapedName}\\s*\\()`);
}

function isInsideAnyRange(range: { start: number; end: number }, ranges: Array<{ start: number; end: number }>): boolean {
  return ranges.some((outer) => outer.start <= range.start && range.end <= outer.end);
}

function sgLanguage(language: Language): string {
  if (language === "python") return "python";
  if (language === "elixir") return "elixir";
  if (language === "c") return "c";
  if (language === "cpp") return "cpp";
  if (language === "rust") return "rust";
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
