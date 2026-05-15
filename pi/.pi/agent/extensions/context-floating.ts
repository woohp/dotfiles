import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";

type Category = { label: string; tokens: number; color: "muted" | "warning" | "accent" | "dim" };
type Snapshot = {
  model: string;
  modelId: string;
  tokens: number;
  max: number;
  pct: number;
  categories: Category[];
  free: number;
  turns: number;
  messages: number;
  cacheRead: number;
  cacheWrite: number;
  cost: number;
};

let enabled = true;
let snapshot: Snapshot = {
  model: "model",
  modelId: "model",
  tokens: 0,
  max: 0,
  pct: 0,
  categories: [],
  free: 0,
  turns: 0,
  messages: 0,
  cacheRead: 0,
  cacheWrite: 0,
  cost: 0,
};

function compact(n?: number): string {
  if (typeof n !== "number" || !Number.isFinite(n)) return "n/a";
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}m`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  return `${Math.round(n)}`;
}

function money(n?: number): string {
  return typeof n === "number" && Number.isFinite(n) ? `$${n.toFixed(4)}` : "n/a";
}

function pct(part: number, total: number): string {
  return total > 0 ? `${((part / total) * 100).toFixed(1)}%` : "n/a";
}

function messageOf(entry: any): any | undefined {
  return entry?.message ?? (entry?.type === "message" ? entry.message : undefined);
}

function estimateTextTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function estimateMessageTokens(msg: any): number {
  const content = msg?.content;
  if (typeof content === "string") return estimateTextTokens(content);
  if (!Array.isArray(content)) return 0;
  return content.reduce((sum, part) => {
    if (part?.type === "text") return sum + estimateTextTokens(part.text ?? "");
    if (part?.type === "thinking") return sum + estimateTextTokens(part.thinking ?? "");
    if (part?.type === "toolCall") return sum + estimateTextTokens(JSON.stringify(part.arguments ?? {}));
    return sum;
  }, 0);
}

function makeSnapshot(ctx: ExtensionContext): Snapshot {
  const usage = ctx.getContextUsage?.();
  const model: any = ctx.model;
  const max = usage?.maxTokens ?? usage?.contextWindow ?? model?.contextWindow ?? 0;
  const tokens = usage?.tokens ?? 0;
  const modelId = model?.id ?? model?.name ?? "model";
  const modelName = model?.name ?? modelId;

  const entries = ctx.sessionManager.getEntries?.() ?? [];
  let turns = 0;
  let messages = 0;
  let cacheRead = 0;
  let cacheWrite = 0;
  let cost = 0;
  let userTokens = 0;
  let assistantTokens = 0;
  let toolTokens = 0;

  for (const entry of entries as any[]) {
    const msg = messageOf(entry);
    if (!msg?.role) continue;
    messages++;
    if (msg.role === "user") turns++;
    const estimated = estimateMessageTokens(msg);
    if (msg.role === "user") userTokens += estimated;
    else if (msg.role === "assistant") assistantTokens += estimated;
    else toolTokens += estimated;

    const u = msg.usage;
    if (u) {
      cacheRead += u.cacheRead ?? 0;
      cacheWrite += u.cacheWrite ?? 0;
      cost += u.cost?.total ?? 0;
    }
  }

  const messageTokens = Math.max(0, Math.min(tokens, userTokens + assistantTokens + toolTokens || tokens));
  const systemTokens = Math.max(0, tokens - messageTokens);

  return {
    model: `${modelName} (${compact(max)} context)`,
    modelId,
    tokens,
    max,
    pct: max > 0 ? Math.round((tokens / max) * 100) : 0,
    categories: [
      { label: "System/context", tokens: systemTokens, color: "muted" },
      { label: "Messages", tokens: messageTokens, color: "accent" },
    ],
    free: Math.max(0, max - tokens),
    turns,
    messages,
    cacheRead,
    cacheWrite,
    cost,
  };
}

function leftPad(line: string, width: number): string {
  return `${" ".repeat(Math.max(0, width - visibleWidth(line)))}${line}`;
}

function installWidget(ctx: ExtensionContext) {
  if (!ctx.hasUI) return;
  if (!enabled) {
    ctx.ui.setWidget("context-floating", undefined);
    return;
  }

  ctx.ui.setWidget(
    "context-floating",
    (_tui: any, theme: any) => ({
      render(width: number) {
        const barWidth = Math.max(10, Math.min(30, Math.floor(width * 0.28)));
        const filled = Math.max(0, Math.min(barWidth, Math.round((snapshot.pct / 100) * barWidth)));
        const bar = theme.fg("accent", "▰".repeat(filled)) + theme.fg("dim", "▱".repeat(barWidth - filled));

        const title = theme.fg("accent", theme.bold ? theme.bold("Context Usage") : "Context Usage");
        const right = theme.fg("muted", snapshot.model);
        const gap = Math.max(1, width - visibleWidth(title) - visibleWidth(right));
        const line1 = truncateToWidth(`${title}${" ".repeat(gap)}${right}`, width, "…");

        const tokenText = theme.fg("muted", `${compact(snapshot.tokens)}/${compact(snapshot.max)} tokens (${snapshot.pct}%)`);
        const stats = theme.fg("dim", `Session Stats · Turns ${snapshot.turns} · Messages ${snapshot.messages} · Cache R ${compact(snapshot.cacheRead)} · Cache W ${compact(snapshot.cacheWrite)} · Cost ${money(snapshot.cost || undefined)}`);
        const line2 = truncateToWidth(`${bar} ${tokenText} · ${stats}`, width, "…");
        return [line1, line2];
      },
      invalidate() {},
    }),
    { placement: "aboveEditor" },
  );
}

function refresh(ctx: ExtensionContext) {
  if (!ctx.hasUI) return;
  snapshot = makeSnapshot(ctx);
  installWidget(ctx);
}

export default function (pi: ExtensionAPI) {
  pi.on("session_start", async (_event, ctx) => refresh(ctx));
  pi.on("message_end", async (_event, ctx) => refresh(ctx));
  pi.on("turn_end", async (_event, ctx) => refresh(ctx));
  pi.on("agent_end", async (_event, ctx) => refresh(ctx));
  pi.on("model_select", async (_event, ctx) => refresh(ctx));

  pi.on("session_shutdown", async (_event, ctx) => {
    ctx.ui.setWidget("context-floating", undefined);
  });

  pi.registerCommand("context-float", {
    description: "Toggle the always-on compact context usage widget",
    handler: async (args, ctx) => {
      const arg = args.trim().toLowerCase();
      enabled = arg === "on" ? true : arg === "off" ? false : !enabled;
      if (enabled) {
        refresh(ctx);
        ctx.ui.notify("Context usage widget shown", "info");
      } else {
        installWidget(ctx);
        ctx.ui.notify("Context usage widget hidden", "info");
      }
    },
  });
}
