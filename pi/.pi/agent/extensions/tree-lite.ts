import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import { Key, matchesKey, truncateToWidth } from "@earendil-works/pi-tui";

type SessionEntry = ReturnType<ExtensionCommandContext["sessionManager"]["getEntries"]>[number];

type VisibleNode = {
  id: string;
  prefix: string;
  kind: string;
  text: string;
  suffix: string;
};

type VisibleTreeNode = {
  entry: SessionEntry;
  visible: { kind: string; text: string };
  children: VisibleTreeNode[];
};

function summarizeText(text: string, max = 72): string {
  const oneLine = text.replace(/\s+/g, " ").trim();
  if (!oneLine) return "(empty)";
  return oneLine.length > max ? `${oneLine.slice(0, max - 1)}…` : oneLine;
}

function getAssistantText(entry: SessionEntry): string | undefined {
  if (entry.type !== "message" || entry.message.role !== "assistant") return undefined;
  const content = Array.isArray(entry.message.content) ? entry.message.content : [];
  const text = content
    .filter((part): part is { type: "text"; text: string } => part?.type === "text" && typeof part.text === "string")
    .map((part) => part.text)
    .join(" ")
    .trim();

  return text || undefined;
}

function getVisibleText(entry: SessionEntry): { kind: string; text: string } | undefined {
  if (entry.type === "message") {
    if (entry.message.role === "toolResult" || entry.message.role === "bashExecution") return undefined;

    if (entry.message.role === "user") {
      const text = typeof entry.message.content === "string"
        ? entry.message.content
        : entry.message.content
            .filter((part): part is { type: "text"; text: string } => part?.type === "text" && typeof part.text === "string")
            .map((part) => part.text)
            .join(" ");
      return { kind: "user", text: text || "(empty)" };
    }

    if (entry.message.role === "assistant") {
      const text = getAssistantText(entry);
      return text ? { kind: "assistant", text } : undefined;
    }

    if (entry.message.role === "branchSummary") {
      return { kind: "summary", text: entry.message.summary };
    }

    if (entry.message.role === "custom") {
      if (!entry.message.display) return undefined;
      const text = typeof entry.message.content === "string"
        ? entry.message.content
        : entry.message.content
            .filter((part): part is { type: "text"; text: string } => part?.type === "text" && typeof part.text === "string")
            .map((part) => part.text)
            .join(" ");
      return text ? { kind: "custom", text } : undefined;
    }

    return undefined;
  }

  if (entry.type === "branch_summary") {
    return { kind: "summary", text: entry.summary };
  }

  if (entry.type === "custom_message") {
    if (!entry.display) return undefined;
    const text = typeof entry.content === "string"
      ? entry.content
      : entry.content
          .filter((part): part is { type: "text"; text: string } => part?.type === "text" && typeof part.text === "string")
          .map((part) => part.text)
          .join(" ");
    return text ? { kind: "custom", text } : undefined;
  }

  return undefined;
}

function getInitialSelectedId(ctx: ExtensionCommandContext, nodes: VisibleNode[]): string | undefined {
  const visibleIds = new Set(nodes.map((node) => node.id));
  let currentId = ctx.sessionManager.getLeafId();

  while (currentId) {
    if (visibleIds.has(currentId)) return currentId;
    const entry = ctx.sessionManager.getEntry(currentId);
    currentId = entry?.parentId ?? undefined;
  }

  return nodes[0]?.id;
}

function buildVisibleNodes(ctx: ExtensionCommandContext): VisibleNode[] {
  const entries = ctx.sessionManager.getEntries();
  const childrenByParent = new Map<string | null, SessionEntry[]>();

  for (const entry of entries) {
    const key = entry.parentId ?? null;
    const siblings = childrenByParent.get(key) ?? [];
    siblings.push(entry);
    childrenByParent.set(key, siblings);
  }

  function collectVisibleChildren(parentId: string | null): VisibleTreeNode[] {
    const children = childrenByParent.get(parentId) ?? [];
    const result: VisibleTreeNode[] = [];

    for (const entry of children) {
      const nestedChildren = collectVisibleChildren(entry.id);
      const visible = getVisibleText(entry);

      if (visible) {
        result.push({ entry, visible, children: nestedChildren });
      } else {
        result.push(...nestedChildren);
      }
    }

    return result;
  }

  const nodes: VisibleNode[] = [];

  function flatten(items: VisibleTreeNode[], ancestors: boolean[]) {
    const branching = items.length > 1;

    items.forEach((item, index) => {
      const isLast = index === items.length - 1;
      const branchPrefix = ancestors.map((hasNext) => (hasNext ? "│  " : "   ")).join("");
      const connector = branching ? (isLast ? "└─ " : "├─ ") : "";
      const label = ctx.sessionManager.getLabel(item.entry.id);
      const suffix = label ? `  [${label}]` : "";

      nodes.push({
        id: item.entry.id,
        prefix: `${branchPrefix}${connector}`,
        kind: item.visible.kind,
        text: summarizeText(item.visible.text),
        suffix: `${suffix} · ${item.entry.id.slice(0, 8)}`,
      });

      flatten(item.children, branching ? [...ancestors, !isLast] : ancestors);
    });
  }

  flatten(collectVisibleChildren(null), []);
  return nodes;
}

export default function (pi: ExtensionAPI) {
  pi.registerCommand("t", {
    description: "Navigate the session tree without tool-call noise",
    handler: async (_args, ctx) => {
      const nodes = buildVisibleNodes(ctx);

      if (nodes.length === 0) {
        ctx.ui.notify("No visible tree entries", "info");
        return;
      }

      const initialSelectedId = getInitialSelectedId(ctx, nodes);

      const selectedId = await ctx.ui.custom<string | null>((tui, theme, _kb, done) => {
        let index = Math.max(0, nodes.findIndex((node) => node.id === initialSelectedId));
        let query = "";
        let cachedWidth = 0;
        let cachedLines: string[] | undefined;

        const kindColor = (kind: string, text: string) => {
          if (kind === "user") return theme.fg("accent", text);
          if (kind === "assistant") return theme.fg("success", text);
          if (kind === "summary") return theme.fg("warning", text);
          return theme.fg("muted", text);
        };

        const getFilteredNodes = () => {
          const needle = query.trim().toLowerCase();
          if (!needle) return nodes;
          return nodes.filter((node) => `${node.kind} ${node.text} ${node.suffix}`.toLowerCase().includes(needle));
        };

        const clampIndex = () => {
          const filtered = getFilteredNodes();
          index = filtered.length === 0 ? 0 : Math.min(index, filtered.length - 1);
          return filtered;
        };

        function refresh() {
          clampIndex();
          cachedLines = undefined;
          tui.requestRender();
        }

        function render(width: number): string[] {
          if (cachedLines && cachedWidth === width) return cachedLines;
          cachedWidth = width;

          const filtered = clampIndex();
          const lines: string[] = [];
          const border = theme.fg("accent", "─".repeat(Math.max(0, width)));
          const bodyHeight = Math.max(5, Math.min(filtered.length || 1, 18));
          const start = Math.max(0, Math.min(index - Math.floor(bodyHeight / 2), Math.max(0, filtered.length - bodyHeight)));
          const end = Math.min(filtered.length, start + bodyHeight);

          lines.push(border);
          lines.push(truncateToWidth(` ${theme.fg("accent", theme.bold("Session Tree Lite"))}`, width));
          lines.push(truncateToWidth(` ${theme.fg("dim", "↑/↓: move • Enter: select • Esc: cancel")}`, width));
          lines.push(truncateToWidth(` ${theme.fg("muted", "Type to search:")} ${query ? theme.fg("text", query) : theme.fg("dim", "")}`, width));
          lines.push(border);
          lines.push("");

          if (filtered.length === 0) {
            lines.push(truncateToWidth(` ${theme.fg("warning", "No matches")}`, width));
          } else {
            for (let i = start; i < end; i++) {
              const node = filtered[i];
              const selected = i === index;
              const marker = selected ? theme.fg("accent", "→ ") : "  ";
              const prefix = theme.fg("dim", node.prefix);
              const kind = kindColor(node.kind, `${node.kind}:`);
              const text = selected ? theme.bold(node.text) : node.text;
              const suffix = theme.fg("muted", node.suffix);
              lines.push(truncateToWidth(`${marker}${prefix}${kind} ${text}${suffix}`, width));
            }
          }

          lines.push("");
          lines.push(truncateToWidth(theme.fg("dim", "Type to filter • Backspace to delete • ↑↓ navigate"), width));
          lines.push(border);

          cachedLines = lines;
          return lines;
        }

        function handleInput(data: string) {
          const filtered = clampIndex();

          if (matchesKey(data, Key.up)) {
            index = Math.max(0, index - 1);
            refresh();
            return;
          }
          if (matchesKey(data, Key.down)) {
            index = Math.min(Math.max(0, filtered.length - 1), index + 1);
            refresh();
            return;
          }
          if (matchesKey(data, Key.enter)) {
            done(filtered[index]?.id ?? null);
            return;
          }
          if (matchesKey(data, Key.backspace)) {
            query = query.slice(0, -1);
            refresh();
            return;
          }
          if (matchesKey(data, Key.escape)) {
            done(null);
            return;
          }
          if (data.length === 1 && data >= " ") {
            query += data;
            index = 0;
            refresh();
          }
        }

        return {
          render,
          invalidate() {
            cachedLines = undefined;
          },
          handleInput,
        };
      });

      if (!selectedId) return;

      await ctx.navigateTree(selectedId, { summarize: false });
    },
  });
}
