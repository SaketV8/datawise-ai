import { google } from "@ai-sdk/google";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/**
 * Centralized model configuration for DataWise.
 *
 * Edit the values below to swap providers/models per role.
 * All places that call `streamText` or `generateText` import from here.
 */

const openrouter = createOpenRouter({
  // apiKey: "YOUR_OPENROUTER_API_KEY",
  apiKey: process.env.OPENROUTER_API_KEY ?? "",
});

const nim = createOpenAICompatible({
  name: "nim",
  baseURL: "https://integrate.api.nvidia.com/v1",
  headers: {
    Authorization: `Bearer ${process.env.NVIDIA_NIM_API_KEY}`,
  },
});

const CURRENT_GOOGLE_MODEL = "models/gemini-2.5-flash";

// const CURRENT_NIM_MODLE = "z-ai/glm4.7";
// const CURRENT_NIM_MODLE = "qwen/qwen3-coder-480b-a35b-instruct";
// const CURRENT_NIM_MODLE = "mistralai/mistral-large-3-675b-instruct-2512";
const CURRENT_NIM_MODLE = "nvidia/nemotron-3-super-120b-a12b";

export const models = {
  /** Main agent that runs the chat + tool loop. */
  //   agent: google('gemini-2.5-pro'),
  // agent: google("gemini-3-flash-preview"),
  // agent: google(CURRENT_GOOGLE_MODEL),
  // agent: openrouter.chat("nvidia/nemotron-3-super-120b-a12b:free"),
  agent: nim.chatModel(CURRENT_NIM_MODLE),

  /** Isolated codegen call for D3 chart code. */
  // chartCodegen: google("gemini-3-flash-preview"),
  // chartCodegen: openrouter.chat("nvidia/nemotron-3-super-120b-a12b:free"),
  // chartCodegen: google("gemma-3-27b-it"),
  // chartCodegen: google(CURRENT_GOOGLE_MODEL),
  chartCodegen: nim.chatModel(CURRENT_NIM_MODLE),

  /** Isolated codegen call for jsPDF report code. */
  // pdfCodegen: google("gemini-3-flash-preview"),
  // pdfCodegen: google(CURRENT_GOOGLE_MODEL),
  // pdfCodegen: openrouter.chat("nvidia/nemotron-3-super-120b-a12b:free"),
  pdfCodegen: nim.chatModel(CURRENT_NIM_MODLE),
};
