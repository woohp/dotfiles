import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { withFileMutationQueue } from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";
import { Type } from "typebox";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

type RegexEditParams = {
    path: string;
    pattern: string;
    flags?: string;
    start_line?: number;
    end_line?: number;
    occurrence?: number;
    all?: boolean;
    content?: string;
    content_path?: string;
    dry_run?: boolean;
};

type Match = {
    from: number;
    to: number;
    line: number;
    matched: string;
    captures: Array<string | undefined>;
    groups?: Record<string, string | undefined>;
};

export default function (pi: ExtensionAPI) {
    pi.registerTool({
        name: "regex_edit",
        label: "Regex Edit",
        description:
            "Replace text with a line-scoped JavaScript regex and $ templates. Matches are unique by default; select an occurrence or all explicitly. Empty replacements delete, and zero-width matches insert.",
        promptSnippet:
            "Replace, insert, delete, or transform text with a line-scoped JavaScript regex",
        promptGuidelines: [
            "Prefer regex_edit when a short unique pattern avoids restating a long target, and for repeated, flexible, multiline, or capture-based edits. Use exact anchors only when they are safer and shorter.",
            "regex_edit uses JavaScript regex encoded in JSON, so escape backslashes (\\s becomes \\\\s). Line bounds constrain where matches begin.",
            "regex_edit requires a unique match by default. Specify occurrence or all when needed, and use dry_run for broad all-match edits.",
            "regex_edit replacements use JavaScript $ templates ($1, $<name>, $&, $$). Empty content deletes, and zero-width matches insert.",
            "regex_edit examples: ^prefix.*$ with m replaces a line; \\bfoo\\b with all replaces words; START[\\s\\S]*?END replaces a block; (?=anchor) inserts; (\\w+)-(\\d+) with $2:$1 reorders.",
            "Use AST-aware tools instead of regex_edit for structural or arbitrarily nested code.",
        ],
        parameters: Type.Object({
            path: Type.String({
                description:
                    "File path, relative to cwd unless absolute. A leading @ is ignored.",
            }),
            pattern: Type.String({
                description:
                    "JavaScript regex source. JSON-escape backslashes (use \\\\s for regex \\s).",
            }),
            flags: Type.Optional(
                Type.String({
                    description:
                        "JavaScript flags: i, m, s, u, v. Use all instead of g; y and d are unsupported.",
                }),
            ),
            start_line: Type.Optional(
                Type.Number({
                    description:
                        "First 1-indexed line where a match may begin.",
                }),
            ),
            end_line: Type.Optional(
                Type.Number({
                    description: "Last 1-indexed line where a match may begin.",
                }),
            ),
            occurrence: Type.Optional(
                Type.Number({
                    description:
                        "Replace this 1-indexed match. Cannot combine with all.",
                }),
            ),
            all: Type.Optional(
                Type.Boolean({
                    description:
                        "Replace all non-overlapping matches. Cannot combine with occurrence.",
                }),
            ),
            content: Type.Optional(
                Type.String({
                    description:
                        "JavaScript replacement template ($1, $<name>, $&, $`, $', $$). Empty content deletes. Provide exactly one of content or content_path.",
                }),
            ),
            content_path: Type.Optional(
                Type.String({
                    description:
                        "File containing the replacement template, relative to cwd. Provide exactly one of content or content_path.",
                }),
            ),
            dry_run: Type.Optional(
                Type.Boolean({
                    description: "Report changes without writing the file.",
                }),
            ),
        }),

        async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
            validateParams(params);

            const cleanPath = params.path.replace(/^@/, "");
            const absolutePath = resolve(ctx.cwd, cleanPath);
            const content = await resolveContent(params, ctx.cwd);

            try {
                return await withFileMutationQueue(absolutePath, async () => {
                    const source = await readFile(absolutePath, "utf8");
                    const matches = selectMatches(source, params);
                    const { next, replacementChars } = applyMatches(
                        source,
                        matches,
                        content,
                    );
                    const replacedChars = matches.reduce(
                        (total, match) => total + match.to - match.from,
                        0,
                    );

                    if (!params.dry_run) {
                        await writeFile(absolutePath, next, "utf8");
                    }

                    const action = params.dry_run ? "Would update" : "Updated";
                    const noun = matches.length === 1 ? "match" : "matches";
                    const summary =
                        `${action} ${cleanPath}: replaced ${matches.length} ${noun} (${replacedChars} chars) with ${replacementChars} chars`;
                    return {
                        content: [{ type: "text", text: summary }],
                        details: {
                            path: cleanPath,
                            pattern: params.pattern,
                            flags: params.flags ?? "",
                            dry_run: !!params.dry_run,
                            match_count: matches.length,
                            replaced_chars: replacedChars,
                            replacement_chars: replacementChars,
                            previews: matches.slice(0, 3).map((match) => ({
                                line: match.line,
                                ...makePreview(source, match.from, match.to),
                            })),
                            previews_truncated: matches.length > 3,
                        },
                    };
                });
            } catch (error) {
                throw new Error(await makeRetryableError(error, content));
            }
        },

        renderCall(args, theme, context) {
            const path = typeof args.path === "string" ? args.path : "?";
            const scope = renderScope(args);
            const selection = args.all === true
                ? "all"
                : typeof args.occurrence === "number"
                ? `occurrence ${args.occurrence}`
                : "unique";
            let text = theme.fg("toolTitle", theme.bold("regex_edit ")) +
                theme.fg("muted", `${path} ${scope} ${selection}`);

            text += context?.expanded
                ? renderExpandedArgs(args, theme)
                : renderCollapsedArgs(args, theme);

            return new Text(text, 0, 0);
        },

        renderResult(result, options, theme, context) {
            const content = result.content[0];
            const message = content?.type === "text" ? content.text : "";
            const prefix = context?.isError
                ? theme.fg("error", "✗ ")
                : theme.fg("success", "✓ ");
            let text = prefix + theme.fg("muted", message);

            if (options.expanded) {
                text += renderExpandedResult(result, theme);
            }

            return new Text(text, 0, 0);
        },
    });
}

function renderScope(args: Record<string, unknown>) {
    const start = typeof args.start_line === "number" ? args.start_line : 1;
    const end = typeof args.end_line === "number" ? args.end_line : "EOF";
    return start === end ? `line ${start}` : `lines ${start}-${end}`;
}

function renderCollapsedArgs(args: Record<string, unknown>, theme: any) {
    const lines = ["", `pattern: ${formatInline(args.pattern, 120)}`];
    if (typeof args.flags === "string" && args.flags) {
        lines.push(`flags: ${args.flags}`);
    }
    if (typeof args.content === "string") {
        lines.push("content:", collapseText(args.content));
    } else if (typeof args.content_path === "string") {
        lines.push(`content_path: ${args.content_path}`);
    }
    if (args.dry_run === true) lines.push("dry_run: true");
    return "\n" + theme.fg("muted", lines.join("\n"));
}

function formatInline(value: unknown, maxChars: number) {
    const text = typeof value === "string" ? JSON.stringify(value) : "?";
    return text.length > maxChars ? text.slice(0, maxChars - 1) + "…" : text;
}

function collapseText(text: string) {
    if (!text) return "(empty)";
    const maxLines = 3;
    const maxChars = 240;
    const lines = text.split("\n");
    let preview = lines.slice(0, maxLines).join("\n");
    const truncated = lines.length > maxLines || preview.length > maxChars;
    if (preview.length > maxChars) preview = preview.slice(0, maxChars);
    return truncated ? preview + "\n…" : preview;
}

function renderExpandedArgs(args: Record<string, unknown>, theme: any) {
    const lines = [""];
    appendArg(lines, "pattern", args.pattern);
    appendArg(lines, "flags", args.flags);
    appendArg(lines, "content", args.content);
    appendArg(lines, "content_path", args.content_path);
    appendArg(lines, "dry_run", args.dry_run);
    return "\n" + theme.fg("muted", lines.join("\n"));
}

function renderExpandedResult(result: any, theme: any) {
    const details = result.details;
    if (!details?.previews?.length) return "";

    const lines = [""];
    for (const preview of details.previews) {
        lines.push(`preview at line ${preview.line}:`);
        lines.push(preview.before);
        lines.push("[replaced]");
        lines.push(preview.replaced);
        lines.push("[/replaced]");
        lines.push(preview.after);
        lines.push("");
    }
    if (details.previews_truncated) lines.push("Additional previews omitted.");
    return "\n" + theme.fg("muted", lines.join("\n"));
}

function appendArg(lines: string[], name: string, value: unknown) {
    if (value === undefined) return;
    lines.push(`${name}:`);
    lines.push(typeof value === "string" ? value : String(value));
    lines.push("");
}

function resolveContent(params: RegexEditParams, cwd: string) {
    const hasContent = params.content !== undefined;
    const hasContentPath = params.content_path !== undefined;
    if (hasContent === hasContentPath) {
        throw new Error("Provide exactly one of content or content_path");
    }
    if (hasContent) return params.content!;

    const cleanPath = params.content_path!.replace(/^@/, "");
    return readFile(resolve(cwd, cleanPath), "utf8");
}

async function makeRetryableError(error: unknown, content: string) {
    const tempRoot = existsSync("/tmp") ? "/tmp" : tmpdir();
    const contentPath = resolve(
        tempRoot,
        `re-${randomUUID().slice(0, 10)}.txt`,
    );
    await writeFile(contentPath, content, "utf8");
    const message = error instanceof Error ? error.message : String(error);
    return `${message}\n\nThe requested content was saved to:\n${contentPath}\n\nRetry regex_edit with content_path set to that file, and adjust the pattern, flags, line scope, or match selection.`;
}

function validateParams(params: RegexEditParams) {
    if (!params.pattern) throw new Error("pattern must be non-empty");
    validatePositiveInteger("start_line", params.start_line);
    validatePositiveInteger("end_line", params.end_line);
    validatePositiveInteger("occurrence", params.occurrence);
    if (
        params.start_line !== undefined &&
        params.end_line !== undefined &&
        params.start_line > params.end_line
    ) {
        throw new Error("start_line must be less than or equal to end_line");
    }
    if (params.occurrence !== undefined && params.all === true) {
        throw new Error("occurrence and all are mutually exclusive");
    }
    validateFlags(params.flags ?? "");
}

function validatePositiveInteger(name: string, value: number | undefined) {
    if (value !== undefined && (!Number.isInteger(value) || value < 1)) {
        throw new Error(`${name} must be a positive integer`);
    }
}

function validateFlags(flags: string) {
    const supported = new Set(["i", "m", "s", "u", "v"]);
    const seen = new Set<string>();
    for (const flag of flags) {
        if (!supported.has(flag)) {
            const hint = flag === "g" ? "; use all: true instead of g" : "";
            throw new Error(`Unsupported regex flag: ${flag}${hint}`);
        }
        if (seen.has(flag)) throw new Error(`Duplicate regex flag: ${flag}`);
        seen.add(flag);
    }
    if (seen.has("u") && seen.has("v")) {
        throw new Error("Regex flags u and v cannot be combined");
    }

    try {
        new RegExp("", flags);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Invalid regex flags: ${message}`);
    }
}

function selectMatches(source: string, params: RegexEditParams) {
    const lineStarts = getLineStarts(source);
    const startLine = params.start_line ?? 1;
    const endLine = params.end_line ?? lineStarts.length;
    validateLineScope(startLine, endLine, lineStarts.length);

    const matches = findMatches(
        source,
        params.pattern,
        params.flags ?? "",
        lineStarts,
        startLine,
        endLine,
    );
    if (matches.length === 0) {
        throw new Error(
            `No regex match found beginning on lines ${startLine}-${endLine}`,
        );
    }

    if (params.all === true) return matches;
    if (params.occurrence !== undefined) {
        if (params.occurrence > matches.length) {
            throw new Error(
                `Occurrence ${params.occurrence} does not exist; found ${matches.length} matches in scope`,
            );
        }
        return [matches[params.occurrence - 1]];
    }
    if (matches.length > 1) {
        throw new Error(
            `Ambiguous regex: found ${matches.length} matches in scope; provide occurrence or all: true`,
        );
    }
    return matches;
}

function validateLineScope(
    startLine: number,
    endLine: number,
    lineCount: number,
) {
    if (startLine > lineCount) {
        throw new Error(
            `start_line ${startLine} is past end of file (${lineCount} lines)`,
        );
    }
    if (endLine > lineCount) {
        throw new Error(
            `end_line ${endLine} is past end of file (${lineCount} lines)`,
        );
    }
}

function findMatches(
    source: string,
    pattern: string,
    flags: string,
    lineStarts: number[],
    startLine: number,
    endLine: number,
) {
    let regex: RegExp;
    try {
        regex = new RegExp(pattern, flags + "g");
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Invalid regular expression: ${message}`);
    }

    const from = lineStarts[startLine - 1];
    const to = endLine < lineStarts.length
        ? lineStarts[endLine]
        : source.length + 1;
    const matches: Match[] = [];
    regex.lastIndex = from;

    while (true) {
        const match = regex.exec(source);
        if (!match || match.index >= to) break;

        matches.push({
            from: match.index,
            to: match.index + match[0].length,
            line: lineOfIndex(lineStarts, match.index),
            matched: match[0],
            captures: match.slice(1),
            groups: match.groups ? { ...match.groups } : undefined,
        });

        if (match[0].length === 0) {
            if (regex.lastIndex >= source.length) break;
            regex.lastIndex = advanceStringIndex(
                source,
                regex.lastIndex,
                flags.includes("u") || flags.includes("v"),
            );
        }
    }

    return matches;
}

function advanceStringIndex(source: string, index: number, unicode: boolean) {
    if (!unicode || index + 1 >= source.length) return index + 1;
    const first = source.charCodeAt(index);
    if (first < 0xd800 || first > 0xdbff) return index + 1;
    const second = source.charCodeAt(index + 1);
    return second >= 0xdc00 && second <= 0xdfff ? index + 2 : index + 1;
}

function applyMatches(source: string, matches: Match[], content: string) {
    const chunks: string[] = [];
    let offset = 0;
    let replacementChars = 0;
    for (const match of matches) {
        const replacement = expandReplacement(source, match, content);
        chunks.push(source.slice(offset, match.from), replacement);
        replacementChars += replacement.length;
        offset = match.to;
    }
    chunks.push(source.slice(offset));
    return { next: chunks.join(""), replacementChars };
}

function expandReplacement(source: string, match: Match, template: string) {
    let replacement = "";
    for (let index = 0; index < template.length; index++) {
        const char = template[index];
        if (char !== "$" || index + 1 >= template.length) {
            replacement += char;
            continue;
        }

        const next = template[index + 1];
        if (next === "$") {
            replacement += "$";
            index++;
        } else if (next === "&") {
            replacement += match.matched;
            index++;
        } else if (next === "`") {
            replacement += source.slice(0, match.from);
            index++;
        } else if (next === "'") {
            replacement += source.slice(match.to);
            index++;
        } else if (next === "<" && match.groups !== undefined) {
            const close = template.indexOf(">", index + 2);
            if (close === -1) {
                replacement += "$";
            } else {
                const name = template.slice(index + 2, close);
                replacement += match.groups[name] ?? "";
                index = close;
            }
        } else if (next >= "0" && next <= "9") {
            const { capture, consumed } = expandNumericCapture(
                match.captures,
                template,
                index + 1,
            );
            if (consumed === 0) {
                replacement += "$";
            } else {
                replacement += capture;
                index += consumed;
            }
        } else {
            replacement += "$";
        }
    }
    return replacement;
}

function expandNumericCapture(
    captures: Array<string | undefined>,
    template: string,
    digitIndex: number,
) {
    const first = Number(template[digitIndex]);
    const hasSecond = digitIndex + 1 < template.length &&
        template[digitIndex + 1] >= "0" && template[digitIndex + 1] <= "9";
    const twoDigits = hasSecond
        ? first * 10 + Number(template[digitIndex + 1])
        : 0;

    if (twoDigits > 0 && twoDigits <= captures.length) {
        return { capture: captures[twoDigits - 1] ?? "", consumed: 2 };
    }
    if (first > 0 && first <= captures.length) {
        return { capture: captures[first - 1] ?? "", consumed: 1 };
    }
    return { capture: "", consumed: 0 };
}

function getLineStarts(source: string) {
    const starts = [0];
    for (let index = 0; index < source.length; index++) {
        if (source[index] === "\n") starts.push(index + 1);
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
    const replaced = source.slice(from, to);
    return {
        before: source.slice(Math.max(0, from - context), from),
        replaced: replaced.length > context * 2
            ? replaced.slice(0, context * 2) + "…"
            : replaced,
        after: source.slice(to, Math.min(source.length, to + context)),
    };
}
