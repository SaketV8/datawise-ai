import { tool, generateText, zodSchema } from "ai";
import { z } from "zod";
import { prompts } from "./prompts.js";
import { models } from "./ai-models.js";

/**
 * IMPORTANT:
 *   - execute_query has NO `execute` — it is intercepted client-side via onToolCall.
 *   - generate_svg_chart and generate_pdf_report DO execute server-side, but only to
 *     make an isolated LLM call that returns code. The code itself runs client-side
 *     in Sandpack. No chart/PDF rendering happens on the server.
 *
 * Note: We wrap zod schemas with `zodSchema()` because zod v4 schemas combined
 * with the AI SDK's internal json-schema converter can produce empty schemas
 * for some providers; `zodSchema()` ensures correct conversion.
 */

const executeQueryInput = zodSchema(
  z.object({
    sql: z
      .string()
      .describe(
        "A valid DuckDB SQL query. Reference tables by their sanitized names.",
      ),
    reasoning: z
      .string()
      .describe(
        "One short sentence explaining why this query answers the user's question.",
      ),
  }),
);

const generateSvgChartInput = zodSchema(
  z.object({
    title: z.string().describe("Chart title shown to the user."),
    description: z
      .string()
      .describe(
        "Natural-language description of what to plot: chart type, x/y axes, grouping, color encoding.",
      ),
    data: z
      .array(z.record(z.string(), z.any()))
      .describe("Array of row objects to plot. Keep under 500 rows."),
  }),
);

const generatePdfReportInput = zodSchema(
  z.object({
    title: z.string().describe("Report title."),
    filename: z
      .string()
      .describe('Suggested filename, e.g. "sales-report-q3.pdf". No spaces.'),
    outline: z
      .array(
        z.object({
          heading: z.string(),
          narrative: z
            .string()
            .describe("1–3 sentence narrative for this section."),
          table: z
            .array(z.record(z.string(), z.any()))
            .optional()
            .describe("Optional rows for a table in this section."),
        }),
      )
      .describe("Ordered list of sections."),
    executiveSummary: z.string().describe("A one-paragraph executive summary."),
  }),
);

function stripCodeFences(s: string): string {
  let out = s.trim();
  if (out.startsWith("```")) {
    out = out.replace(/^```[a-zA-Z]*\n?/, "").replace(/```\s*$/, "");
  }
  return out.trim();
}

export const tools = {
  execute_query: tool({
    description:
      "Execute a SQL query against the user's in-browser DuckDB-WASM database. Use for any aggregation, filter, join, or lookup. DuckDB SQL dialect.",
    inputSchema: executeQueryInput,
    // No `execute` — handled by client onToolCall.
  }),

  generate_svg_chart: tool({
    description:
      "Generate a D3.js SVG chart. Use only when a visualization meaningfully helps. Provide a clear description, the data array (from a prior query), and a title.",
    inputSchema: generateSvgChartInput,
    execute: async ({
      title,
      description,
      data,
    }: {
      title: string;
      description: string;
      data: Array<Record<string, unknown>>;
    }) => {
      const userPrompt = `Title: ${title}

Description:
${description}

Data (JSON, hardcode this into the component as \`const data = [...]\`):
${JSON.stringify(data).slice(0, 50_000)}

Generate the App.js code now.`;

      const { text } = await generateText({
        // model: google("gemini-3-flash-preview"),
        model: models.chartCodegen,
        system: prompts.d3Skills,
        prompt: userPrompt,
      });

      return {
        code: stripCodeFences(text),
        title,
        kind: "svg-chart" as const,
      };
    },
  }),

  generate_pdf_report: tool({
    description:
      "Generate a downloadable PDF report. Use ONLY when the user explicitly requests a report, PDF, or export. Provide title, outline of sections, and any tabular data.",
    inputSchema: generatePdfReportInput,
    execute: async ({
      title,
      filename,
      outline,
      executiveSummary,
    }: {
      title: string;
      filename: string;
      outline: Array<{
        heading: string;
        narrative: string;
        table?: Array<Record<string, unknown>>;
      }>;
      executiveSummary: string;
    }) => {
      const userPrompt = `Title: ${title}
Filename: ${filename}

Executive summary:
${executiveSummary}

Outline (JSON, hardcode this into the component):
${JSON.stringify(outline).slice(0, 50_000)}

Generate the App.js code now.`;

      const { text } = await generateText({
        // model: google("gemini-3-flash-preview"),
        model: models.pdfCodegen,
        system: prompts.pdfSkills,
        prompt: userPrompt,
      });

      return {
        code: stripCodeFences(text),
        title,
        filename,
        kind: "pdf-report" as const,
      };
    },
  }),
};

export type DataWiseTools = typeof tools;
