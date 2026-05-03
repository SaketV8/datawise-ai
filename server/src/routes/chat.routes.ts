import { Hono } from "hono";
import {
  streamText,
  convertToModelMessages,
  stepCountIs,
  type UIMessage,
} from "ai";

import { tools } from "../tools";
import { prompts } from "../prompts";
import { models } from "../ai-models";

export const chatRoutes = new Hono();

/**
 * Main chat endpoint. Streams a UI-message response.
 */
chatRoutes.post("/chat", async (c) => {
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
    model: models.agent,
    system,
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(8),
  });

  return result.toUIMessageStreamResponse();
});
