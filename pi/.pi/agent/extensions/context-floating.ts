import { getAgentDir, type ExtensionAPI, type ExtensionContext } from "@earendil-works/pi-coding-agent";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

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

// ── Token speed (self-contained; settings compatible with the `tokenSpeed`
// block of ~/.pi/agent/settings.json, a subset of the pi-token-speed ext) ──

type TpsConfig = {
  tpsMedium: number;
  tpsFast: number;
  tpsBlazing: number;
  colorSlow: string;
  colorMedium: string;
  colorFast: string;
  colorBlazing: string;
  slidingWindow: number;
  display: "tps" | "ttft" | "stats" | "full";
};

const tpsConfig: TpsConfig = {
  tpsMedium: 15,
  tpsFast: 30,
  tpsBlazing: 45,
  colorSlow: "#ff4444",
  colorMedium: "#ffaa00",
  colorFast: "#00ff88",
  colorBlazing: "#44ddff",
  slidingWindow: 1000,
  display: "full",
};

const MIN_SPAN_MS = 250;
const TOKEN_REGEX = /\w+|[^\s\w]/g;
const TPS_RENDER_INTERVAL_MS = 150;

let tpsLoaded = false;
let events: { time: number; tokens: number }[] = [];
let streaming = false;
let tokenCount = 0;
let startTime = 0;
let endTime = 0;
let ttftStart = 0;
let ttft: number | null = null;
let lastTpsRender = 0;

async function loadTpsConfig() {
  if (tpsLoaded) return;
  tpsLoaded = true;
  try {
    const raw = await readFile(join(getAgentDir(), "settings.json"), "utf-8");
    const user = JSON.parse(raw)?.tokenSpeed;
    if (user && typeof user === "object") {
      for (const key of Object.keys(tpsConfig) as (keyof TpsConfig)[]) {
        const value = user[key];
        if (typeof value === typeof tpsConfig[key]) (tpsConfig as any)[key] = value;
      }
    }
  } catch {
    // keep defaults
  }
  tpsConfig.slidingWindow = Math.min(30_000, Math.max(100, tpsConfig.slidingWindow));
}

function startStream() {
  if (streaming) return;
  streaming = true;
  events = [];
  tokenCount = 0;
  startTime = Date.now();
  endTime = 0;
}

function recordDelta(delta: string, providerOutput?: number) {
  if (!streaming) return;
  // The sliding window is always fed by estimated tokens, since providers such as
  // Anthropic report usage only sporadically and the window would otherwise go empty.
  const estimated = (delta.match(TOKEN_REGEX) ?? []).length || 1;
  tokenCount += estimated;
  events.push({ time: Date.now(), tokens: estimated });
  if (events.length > 4096) events = events.slice(-1024);
  // Provider-reported cumulative counts are authoritative: snap the total up to them.
  if (typeof providerOutput === "number" && providerOutput > tokenCount) tokenCount = providerOutput;
}

function elapsedSeconds(): number {
  if (!startTime) return 0;
  return Math.max(0, ((endTime || Date.now()) - startTime) / 1000);
}

function currentTps(): number | null {
  if (!startTime) return null;
  if (!streaming) {
    const secs = elapsedSeconds();
    return secs > 0 ? tokenCount / secs : null;
  }
  const now = Date.now();
  const windowStart = now - tpsConfig.slidingWindow;
  const inWindow = events.filter((e) => e.time >= windowStart);
  if (inWindow.length === 0) return null;
  const tokens = inWindow.reduce((sum, e) => sum + e.tokens, 0);
  const span = Math.max(now - inWindow[0].time, MIN_SPAN_MS);
  return (1000 * tokens) / span;
}

function tpsColor(tps: number): string {
  if (tps >= tpsConfig.tpsBlazing) return tpsConfig.colorBlazing;
  if (tps >= tpsConfig.tpsFast) return tpsConfig.colorFast;
  if (tps >= tpsConfig.tpsMedium) return tpsConfig.colorMedium;
  return tpsConfig.colorSlow;
}

function hex(text: string, color: string): string {
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return text;
  return `\x1b[38;2;${r};${g};${b}m${text}\x1b[0m`;
}

function tpsSegment(theme: any): string {
  const tps = currentTps();
  const value = tps == null ? "--" : hex(`${tps.toFixed(1)} tok/s`, tpsColor(tps));
  const parts: string[] = [];
  const display = tpsConfig.display;
  if (display === "stats" || display === "full") {
    const secs = elapsedSeconds();
    parts.push(secs > 0 ? `${compact(tokenCount)} tok in ${secs.toFixed(0)}s` : `${compact(tokenCount)} tok`);
  }
  if ((display === "ttft" || display === "full") && ttft != null) parts.push(`TTFT ${(ttft / 1000).toFixed(1)}s`);
  const suffix = parts.length > 0 ? theme.fg("dim", ` (${parts.join(" · ")})`) : "";
  return `${theme.fg("dim", "⚡")} ${value}${suffix}`;
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
        const stats = theme.fg("dim", `Turns ${snapshot.turns} · Messages ${snapshot.messages} · Cache R ${compact(snapshot.cacheRead)} · Cache W ${compact(snapshot.cacheWrite)} · Cost ${money(snapshot.cost || undefined)}`);
        const line2 = truncateToWidth(`${bar} ${tokenText} · ${stats}`, width, "…");

        const tps = tpsSegment(theme);
        const room = width - visibleWidth(line2) - visibleWidth(tps) - 1;
        return [line1, room > 0 ? `${line2}${" ".repeat(room)}${tps}` : line2];
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
  pi.on("session_start", async (_event, ctx) => {
    await loadTpsConfig();
    refresh(ctx);
  });
  pi.on("message_end", async (_event, ctx) => refresh(ctx));
  pi.on("turn_end", async (_event, ctx) => refresh(ctx));
  pi.on("model_select", async (_event, ctx) => refresh(ctx));

  pi.on("message_start", async (event: any) => {
    if (event?.message?.role === "user") {
      ttftStart = Date.now();
      ttft = null;
    }
  });

  pi.on("message_update", async (event: any, ctx) => {
    const ev = event?.assistantMessageEvent;
    if (!ev) return;
    if (ev.type === "text_start" || ev.type === "thinking_start" || ev.type === "toolcall_start") {
      if (ttftStart && ttft == null) ttft = Date.now() - ttftStart;
      startStream();
      return;
    }
    if (ev.type === "text_delta" || ev.type === "thinking_delta" || ev.type === "toolcall_delta") {
      recordDelta(ev.delta ?? "", ev.partial?.usage?.output);
      const now = Date.now();
      if (now - lastTpsRender >= TPS_RENDER_INTERVAL_MS) {
        lastTpsRender = now;
        installWidget(ctx);
      }
    }
  });

  pi.on("agent_end", async (event: any, ctx) => {
    if (streaming) {
      streaming = false;
      endTime = Date.now();
    }
    const output = (event?.messages ?? []).reduce(
      (acc: number, msg: any) => acc + (msg?.usage?.output ?? 0),
      0,
    );
    if (output > tokenCount) tokenCount = output;
    refresh(ctx);
  });

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
