"use client";

import type { UIMessage } from "ai";
import { ChartRenderer } from "./chart-renderer";
import { PdfRenderer } from "./pdf-renderer";

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
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-lg px-4 py-3 text-sm leading-relaxed space-y-3 ${
          isUser
            ? "bg-[var(--color-accent)] text-white"
            : "bg-[var(--color-panel)] border border-[var(--color-border)]"
        }`}
      >
        {message.parts.map((part, idx) => {
          if (part.type === "text") {
            return (
              <div key={idx} className="whitespace-pre-wrap">
                {part.text}
              </div>
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
          }

          return null;
        })}
      </div>
    </div>
  );
}

function StateBadge({ state }: { state: string }) {
  const color =
    state === "output-available"
      ? "text-green-400"
      : state === "output-error"
        ? "text-red-400"
        : "text-gray-400";
  return (
    <span className={`text-[10px] uppercase tracking-wide ${color}`}>
      {state.replace(/-/g, " ")}
    </span>
  );
}

/* ---------- execute_query ---------- */

type ExecuteQueryInput = { sql?: string; reasoning?: string };

function ExecuteQueryPart({ part }: { part: ToolPartLike }) {
  const input = (part.input ?? {}) as ExecuteQueryInput;
  const sql = input.sql;
  const reasoning = input.reasoning;
  const output = part.output;

  return (
    <div className="overflow-hidden rounded-md border border-[var(--color-border)] bg-[#0e1115]">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-3 py-1.5">
        <div className="text-xs font-medium">🔎 SQL Query</div>
        <StateBadge state={part.state} />
      </div>
      {reasoning && (
        <div className="px-3 pt-2 text-xs italic text-gray-400">
          {reasoning}
        </div>
      )}
      {sql && (
        <pre className="whitespace-pre-wrap px-3 py-2 font-mono text-xs text-cyan-200">
          {sql}
        </pre>
      )}
      {part.state === "output-available" && Array.isArray(output) && (
        <ResultPreview rows={output as Record<string, unknown>[]} />
      )}
      {part.state === "output-available" &&
        typeof output === "string" &&
        output.startsWith("ERROR:") && (
          <div className="px-3 pb-2 text-xs text-red-400">{output}</div>
        )}
      {part.state === "output-error" && (
        <div className="px-3 pb-2 text-xs text-red-400">
          Error: {part.errorText}
        </div>
      )}
    </div>
  );
}

function ResultPreview({ rows }: { rows: Record<string, unknown>[] }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="px-3 pb-2 text-xs text-gray-500">No rows returned.</div>
    );
  }
  const cols = Object.keys(rows[0] ?? {});
  const preview = rows.slice(0, 10);
  return (
    <div className="max-h-64 overflow-auto border-t border-[var(--color-border)]">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-[var(--color-panel)]">
          <tr>
            {cols.map((c) => (
              <th
                key={c}
                className="border-b border-[var(--color-border)] px-3 py-1.5 text-left font-medium"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {preview.map((r, i) => (
            <tr
              key={i}
              className="border-b border-[var(--color-border)] last:border-b-0"
            >
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
        <div className="px-3 py-1.5 text-[10px] text-gray-500">
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

type ChartInput = { title?: string };
type ChartOutput = { code?: string; title?: string };

function SvgChartPart({ part }: { part: ToolPartLike }) {
  if (part.state === "input-streaming" || part.state === "input-available") {
    return <div className="text-xs text-gray-400">📊 Generating chart…</div>;
  }
  if (part.state === "output-error") {
    return (
      <div className="text-xs text-red-400">
        Chart generation failed: {part.errorText}
      </div>
    );
  }
  if (part.state === "output-available") {
    const out = (part.output ?? {}) as ChartOutput;
    const input = (part.input ?? {}) as ChartInput;
    if (out.code) {
      return (
        <ChartRenderer
          title={out.title || input.title || "Chart"}
          code={out.code}
        />
      );
    }
  }
  return null;
}

/* ---------- generate_pdf_report ---------- */

type PdfInput = { title?: string; filename?: string };
type PdfOutput = { code?: string; title?: string; filename?: string };

function PdfReportPart({ part }: { part: ToolPartLike }) {
  if (part.state === "input-streaming" || part.state === "input-available") {
    return <div className="text-xs text-gray-400">📄 Building PDF report…</div>;
  }
  if (part.state === "output-error") {
    return (
      <div className="text-xs text-red-400">
        PDF generation failed: {part.errorText}
      </div>
    );
  }
  if (part.state === "output-available") {
    const out = (part.output ?? {}) as PdfOutput;
    const input = (part.input ?? {}) as PdfInput;
    if (out.code) {
      return (
        <PdfRenderer
          title={out.title || input.title || "Report"}
          filename={out.filename || input.filename || "report.pdf"}
          code={out.code}
        />
      );
    }
  }
  return null;
}
