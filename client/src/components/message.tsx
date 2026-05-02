"use client";

import type { UIMessage } from "ai";
import {
  Message as AIMessage,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import { ChartRenderer } from "./chart-render/chart-renderer";
import { PdfRenderer } from "./pdf-renderer";
import { Loader2 } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

type Props = {
  message: UIMessage;
};

type ToolPartLike = {
  type: string;
  state:
    | "input-streaming"
    | "input-available"
    | "output-available"
    | "output-error";
  toolCallId: string;
  input?: unknown;
  output?: unknown;
  errorText?: string;
};

function isToolPart(p: unknown): p is ToolPartLike {
  return (
    !!p &&
    typeof p === "object" &&
    typeof (p as { type?: unknown }).type === "string" &&
    ((p as { type: string }).type.startsWith("tool-") ||
      (p as { type: string }).type === "dynamic-tool")
  );
}

export function Message({ message }: Props) {
  return (
    // <MessageContent>
    // <MessageContent className="max-w-full overflow-hidden">
    <AIMessage from={message.role}>
      <MessageContent className="w-full min-w-0">
        {message.parts.map((part, idx) => {
          if (part.type === "text") {
            // MessageResponse renders streaming markdown via Streamdown
            return <MessageResponse key={idx}>{part.text}</MessageResponse>;
          }

          if (part.type === "reasoning") {
            return (
              // <div
              //   key={idx}
              //   className="text-xs italic text-muted-foreground border-l-2 pl-2 my-1"
              // >
              //   {(part as { text?: string }).text}
              // </div>
              <Collapsible key={idx} className="my-2 w-full min-w-0">
                <CollapsibleTrigger className="flex w-full items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground">
                  <ChevronDown className="h-3 w-3" />
                  Reasoning
                </CollapsibleTrigger>

                <CollapsibleContent className="w-full min-w-0">
                  <div className="mt-2 w-full min-w-0 overflow-x-auto text-xs italic text-muted-foreground border-l-2 pl-3 py-1 bg-muted/30 rounded-r-md">
                    {(part as { text?: string }).text}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          }

          if (isToolPart(part)) {
            const toolName = part.type.replace(/^tool-/, "");

            if (toolName === "execute_query") {
              return <ExecuteQueryPart key={idx} part={part} />;
            }
            if (toolName === "generate_svg_chart") {
              return <SvgChartPart key={idx} part={part} />;
            }
            if (toolName === "generate_pdf_report") {
              return <PdfReportPart key={idx} part={part} />;
            }

            return (
              // <Tool key={idx}>
              <Tool key={idx} className="w-full min-w-0">
                <ToolHeader
                  type={part.type as `tool-${string}`}
                  state={part.state}
                />
                {/* <ToolContent> */}
                {/*<ToolContent className="overflow-hidden">*/}
                <ToolContent className="w-full min-w-0 overflow-x-auto">
                  <ToolInput input={part.input} />
                  <ToolOutput
                    output={part.output as never}
                    errorText={part.errorText}
                  />
                </ToolContent>
              </Tool>
            );
          }

          return null;
        })}
      </MessageContent>
    </AIMessage>
  );
}

/* ---------- execute_query ---------- */

type ExecuteQueryInput = { sql?: string; reasoning?: string };

function ExecuteQueryPart({ part }: { part: ToolPartLike }) {
  const input = (part.input ?? {}) as ExecuteQueryInput;
  const output = part.output;
  const isError =
    part.state === "output-error" ||
    (part.state === "output-available" &&
      typeof output === "string" &&
      output.startsWith("ERROR:"));

  return (
    // <Tool defaultOpen>
    <Tool defaultOpen={false}>
      <ToolHeader type="tool-execute_query" state={part.state} />
      {/* <ToolContent> */}
      <ToolContent className="w-full min-w-0 overflow-x-auto">
        {/*{input.reasoning && (
          <div className="px-3 pt-2 text-xs italic text-muted-foreground">
            {input.reasoning}
          </div>
        )}*/}
        {input.reasoning && (
          <div className="w-full min-w-0 overflow-x-auto px-3 pt-2 text-xs italic text-muted-foreground">
            {input.reasoning}
          </div>
        )}
        <ToolInput input={{ sql: input.sql }} />

        {part.state === "input-streaming" && (
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Composing SQL…
          </div>
        )}
        {part.state === "input-available" && (
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Running on DuckDB-WASM…
          </div>
        )}

        {part.state === "output-available" && Array.isArray(output) && (
          <ResultPreview rows={output as Record<string, unknown>[]} />
        )}
        {isError && (
          <ToolOutput
            output={undefined as never}
            errorText={
              part.errorText ??
              (typeof output === "string" ? output : "Query failed")
            }
          />
        )}
      </ToolContent>
    </Tool>
  );
}

function ResultPreview({ rows }: { rows: Record<string, unknown>[] }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="px-3 pb-2 text-xs text-muted-foreground">
        No rows returned.
      </div>
    );
  }
  const cols = Object.keys(rows[0] ?? {});
  const preview = rows.slice(0, 10);
  return (
    // <div className="max-h-64 overflow-auto border-t">
    <div className="max-h-64 w-full overflow-x-auto overflow-y-auto border-t">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-muted">
          <tr>
            {cols.map((c) => (
              <th
                key={c}
                className="border-b px-3 py-1.5 text-left font-medium"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {preview.map((r, i) => (
            <tr key={i} className="border-b last:border-b-0">
              {cols.map((c) => (
                <td key={c} className="whitespace-nowrap px-3 py-1 font-mono">
                  {formatCell(r[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > preview.length && (
        <div className="px-3 py-1.5 text-[10px] text-muted-foreground">
          Showing {preview.length} of {rows.length} rows
        </div>
      )}
    </div>
  );
}

function formatCell(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "number")
    return Number.isInteger(v) ? v.toLocaleString() : v.toFixed(4);
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

/* ---------- generate_svg_chart ---------- */

type ChartInput = { title?: string; description?: string };
type ChartOutput = { code?: string; title?: string };

function SvgChartPart({ part }: { part: ToolPartLike }) {
  const input = (part.input ?? {}) as ChartInput;

  if (part.state === "input-streaming") {
    return (
      // <Tool defaultOpen={false}>
      <Tool defaultOpen>
        <ToolHeader type="tool-generate_svg_chart" state={part.state} />
        {/* <ToolContent> */}
        <ToolContent className="w-full min-w-0 overflow-x-auto">
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Designing chart…
          </div>
        </ToolContent>
      </Tool>
    );
  }
  if (part.state === "input-available") {
    return (
      <Tool defaultOpen>
        <ToolHeader type="tool-generate_svg_chart" state={part.state} />
        {/* <ToolContent> */}
        <ToolContent className="w-full min-w-0 overflow-x-auto">
          <div className="px-3 pt-2 text-xs">
            <div className="font-medium">{input.title}</div>
            {input.description && (
              <div className="text-muted-foreground mt-1">
                {input.description}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Generating D3 code…
          </div>
        </ToolContent>
      </Tool>
    );
  }
  if (part.state === "output-error") {
    return (
      <Tool defaultOpen>
        <ToolHeader type="tool-generate_svg_chart" state={part.state} />
        {/* <ToolContent > */}
        <ToolContent className="w-full min-w-0 overflow-x-auto">
          <ToolOutput output={undefined as never} errorText={part.errorText} />
        </ToolContent>
      </Tool>
    );
  }
  if (part.state === "output-available") {
    const out = (part.output ?? {}) as ChartOutput;
    if (out.code) {
      return (
        <div className="max-w-full overflow-x-auto rounded-lg border bg-card">
          <ChartRenderer
            title={out.title || input.title || "Chart"}
            code={out.code}
          />
        </div>
      );
    }
  }
  return null;
}

/* ---------- generate_pdf_report ---------- */

type PdfInput = {
  title?: string;
  filename?: string;
  executiveSummary?: string;
};
type PdfOutput = { code?: string; title?: string; filename?: string };

function PdfReportPart({ part }: { part: ToolPartLike }) {
  const input = (part.input ?? {}) as PdfInput;

  if (part.state === "input-streaming") {
    return (
      <Tool defaultOpen>
        <ToolHeader type="tool-generate_pdf_report" state={part.state} />
        {/* <ToolContent> */}
        <ToolContent className="w-full min-w-0 overflow-x-auto">
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Outlining report…
          </div>
        </ToolContent>
      </Tool>
    );
  }
  if (part.state === "input-available") {
    return (
      <Tool defaultOpen>
        <ToolHeader type="tool-generate_pdf_report" state={part.state} />
        {/* <ToolContent> */}
        <ToolContent className="w-full min-w-0 overflow-x-auto">
          {input.title && (
            <div className="px-3 pt-2 text-xs font-medium">{input.title}</div>
          )}
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Generating PDF code…
          </div>
        </ToolContent>
      </Tool>
    );
  }
  if (part.state === "output-error") {
    return (
      <Tool defaultOpen>
        <ToolHeader type="tool-generate_pdf_report" state={part.state} />
        {/* <ToolContent> */}
        <ToolContent className="w-full min-w-0 overflow-x-auto">
          <ToolOutput output={undefined as never} errorText={part.errorText} />
        </ToolContent>
      </Tool>
    );
  }
  if (part.state === "output-available") {
    const out = (part.output ?? {}) as PdfOutput;
    if (out.code) {
      return (
        <>
          <PdfRenderer
            title={out.title || input.title || "Report"}
            filename={out.filename || input.filename || "report.pdf"}
            code={out.code}
          />
        </>
      );
    }
  }
  return null;
}
