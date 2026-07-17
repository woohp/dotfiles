import { completeSimple } from "@earendil-works/pi-ai/compat";
import {
  getAgentDir,
  type ExtensionAPI,
  type ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const MAX_TITLE_LENGTH = 80;
const TITLE_PROMPT = `Generate a concise title for this coding-agent session based on the user's request.

Requirements:
- Describe the user's main task or question.
- When natural, include a concrete identifying detail such as a file, component, command, error, or model.
- Use 3-8 words in sentence case.
- Return only the title.
- Do not use quotes, markdown, a trailing period, or a prefix such as "Title:".
- Do not mention tools, the assistant, or the conversation.`;

type Message = {
  role?: string;
  content?: string | Array<{ type?: string; text?: string }>;
};

type TitleConfig = {
  model?: string;
};

type ConversationMessage = {
  role: "user" | "assistant";
  text: string;
};

export default function (pi: ExtensionAPI) {
  let eligible = false;
  let generating = false;
  let sessionActive = false;

  pi.on("session_start", () => {
    eligible = !pi.getSessionName();
    generating = false;
    sessionActive = true;
  });

  pi.on("session_shutdown", () => {
    sessionActive = false;
  });

  pi.on("before_agent_start", (event, ctx) => {
    if (!eligible || generating || pi.getSessionName()) return;
    const messages = firstConversationMessages(ctx);
    if (messages.length === 0)
      messages.push({ role: "user", text: event.prompt });
    void createAndSetTitle(ctx, messages);
  });

  pi.registerCommand("generate-title", {
    description: "Generate a title for the current session",
    handler: async (_args, ctx) => {
      if (pi.getSessionName()) {
        ctx.ui.notify("This session already has a title", "info");
        return;
      }

      const messages = firstConversationMessages(ctx);
      if (!messages.some((message) => message.role === "user")) {
        ctx.ui.notify("This session has no user messages to title", "warning");
        return;
      }

      await createAndSetTitle(ctx, messages);
    },
  });

  pi.registerCommand("clear-title", {
    description: "Clear the current session title",
    handler: async () => {
      pi.setSessionName("");
      eligible = true;
    },
  });

  async function createAndSetTitle(
    ctx: ExtensionContext,
    messages: ConversationMessage[],
  ) {
    if (generating) return;

    const sessionId = ctx.sessionManager.getSessionId();
    generating = true;

    try {
      const title = await generateTitle(ctx, messages);
      if (!title) throw new Error("The title model returned no text");
      if (!sessionActive) return;
      if (ctx.sessionManager.getSessionId() !== sessionId) return;
      if (pi.getSessionName()) return;
      pi.setSessionName(title);
    } catch (error) {
      if (sessionActive && ctx.hasUI) {
        const message = error instanceof Error ? error.message : String(error);
        ctx.ui.notify(
          `Could not generate session title: ${message}`,
          "warning",
        );
      }
    } finally {
      eligible = false;
      generating = false;
    }
  }

  async function generateTitle(
    ctx: ExtensionContext,
    messages: ConversationMessage[],
  ) {
    const configuredModel = await readConfiguredModel();
    const model = configuredModel
      ? resolveConfiguredModel(ctx, configuredModel)
      : ctx.model;
    if (!model)
      throw new Error(
        configuredModel
          ? `Model not found: ${configuredModel}`
          : "No active model",
      );

    const auth = await ctx.modelRegistry.getApiKeyAndHeaders(model);
    if (!auth.ok) throw new Error(auth.error);
    if (!auth.apiKey)
      throw new Error(`No API key for ${model.provider}/${model.id}`);

    const conversation = messages
      .map(({ role, text }) => `<${role}-message>\n${text}\n</${role}-message>`)
      .join("\n\n");
    const response = await completeSimple(
      model,
      {
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: `${TITLE_PROMPT}\n\n${conversation}` },
            ],
            timestamp: Date.now(),
          },
        ],
      },
      {
        apiKey: auth.apiKey,
        headers: auth.headers,
        env: auth.env,
        maxTokens: 4096,
        reasoning: "minimal",
        sessionId: ctx.sessionManager.getSessionId(),
      },
    );

    const text = response.content
      .filter(
        (part): part is { type: "text"; text: string } => part.type === "text",
      )
      .map((part) => part.text)
      .join(" ");
    const title = normalizeTitle(text);
    if (!title) {
      if (response.errorMessage) throw new Error(response.errorMessage);
      const contentTypes =
        response.content.map((part) => part.type).join(", ") || "none";
      throw new Error(
        `The title model returned no text (stop: ${response.stopReason}; content: ${contentTypes})`,
      );
    }
    return title;
  }
}

function firstConversationMessages(
  ctx: ExtensionContext,
): ConversationMessage[] {
  const messages: ConversationMessage[] = [];
  for (const entry of ctx.sessionManager.getBranch()) {
    if (entry.type !== "message") continue;
    const message = entry.message as Message;
    if (message.role !== "user" && message.role !== "assistant") continue;
    const text = messageText(message);
    if (!text) continue;
    messages.push({ role: message.role, text });
    if (messages.length === 4) break;
  }
  return messages;
}

function messageText(message: Message): string {
  if (typeof message.content === "string") return message.content.trim();
  if (!Array.isArray(message.content)) return "";
  return message.content
    .filter((part) => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text!.trim())
    .filter(Boolean)
    .join("\n");
}

async function readConfiguredModel(): Promise<string | undefined> {
  const settingsPath = join(getAgentDir(), "settings.json");
  let settings: unknown;
  try {
    settings = JSON.parse(await readFile(settingsPath, "utf8"));
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return undefined;
    throw new Error(`Could not read ${settingsPath}`);
  }

  if (!settings || typeof settings !== "object") return undefined;
  const config = (settings as { autoSessionTitle?: unknown }).autoSessionTitle;
  if (config === undefined) return undefined;
  if (!config || typeof config !== "object")
    throw new Error("autoSessionTitle must be an object");

  const model = (config as TitleConfig).model;
  if (model === undefined) return undefined;
  if (typeof model !== "string" || !model.trim())
    throw new Error("autoSessionTitle.model must be a model string");
  return model.trim();
}

function resolveConfiguredModel(
  ctx: ExtensionContext,
  configuredModel: string,
) {
  const separator = configuredModel.indexOf("/");
  if (separator < 1 || separator === configuredModel.length - 1) {
    throw new Error("autoSessionTitle.model must use provider/model-id format");
  }
  return ctx.modelRegistry.find(
    configuredModel.slice(0, separator),
    configuredModel.slice(separator + 1),
  );
}

function normalizeTitle(value: string): string | undefined {
  let title = value
    .replace(/^```(?:text)?\s*/i, "")
    .replace(/\s*```$/, "")
    .replace(/^\s*(?:title\s*:\s*)/i, "")
    .replace(/^[\s"'`*_]+|[\s"'`*_]+$/g, "")
    .replace(/[.!?:;,]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!title) return undefined;
  if (title.length > MAX_TITLE_LENGTH)
    title = title.slice(0, MAX_TITLE_LENGTH).trimEnd();
  return title || undefined;
}
