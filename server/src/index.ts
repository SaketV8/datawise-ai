import "dotenv/config";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { google } from "@ai-sdk/google";

import {
  streamText,
  convertToModelMessages,
  stepCountIs,
  type UIMessage,
} from "ai";
import { tools } from "./tools";
import { prompts } from "./prompts";

import { models } from "./ai-models";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

app.get("/", (c) => c.json({ ok: true, service: "datawise-server" }));

/**
 * Main chat endpoint. Streams a UI-message response.
 *
 * Body shape:
 *   - messages: UIMessage[]
 *   - datasetContext: string  (server-augmented system prompt)
 */
app.post("/api/chat", async (c) => {
  const body = await c.req.json<{
    messages: UIMessage[];
    datasetContext?: string;
  }>();

  const { messages, datasetContext = "" } = body;

  const system =
    prompts.mainAgent +
    (datasetContext
      ? `\n\n## Currently Loaded Datasets\n\n${datasetContext}`
      : "\n\n## Currently Loaded Datasets\n\n(no datasets loaded yet — ask the user to upload a CSV or XLSX file)");

  const result = streamText({
    // model: google("gemini-2.5-pro"),
    // model: google("gemini-3-flash-preview"),
    // model: openrouter.chat("nvidia/nemotron-3-super-120b-a12b:free"),
    model: models.agent,
    system,
    // v6: convertToModelMessages is async.
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(8),
  });

  return result.toUIMessageStreamResponse();
});

/**
 * Prompt management — in-memory only.
 */
app.get("/api/prompts", (c) => c.json(prompts));

app.put("/api/prompts/:key", async (c) => {
  const key = c.req.param("key") as keyof typeof prompts;
  if (!(key in prompts)) {
    return c.json({ error: `Unknown prompt key: ${key}` }, 400);
  }
  const { value } = await c.req.json<{ value: string }>();
  if (typeof value !== "string") {
    return c.json({ error: "value must be a string" }, 400);
  }
  prompts[key] = value;
  return c.json({ ok: true, key, length: value.length });
});

const port = Number(process.env.PORT ?? 8787);
serve({ fetch: app.fetch, port }, (info) => {
  // eslint-disable-next-line no-console
  console.log(`🚀 datawise-server listening on http://localhost:${info.port}`);
});
