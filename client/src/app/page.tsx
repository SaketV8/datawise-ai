/* eslint-disable react-hooks/refs */
"use client";

import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
} from "ai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Database, Sparkles } from "lucide-react";

import { useDuckDB } from "@/hooks/use-duckdb";
import { FileUpload } from "@/components/file-upload";
import { Message } from "@/components/message";
import { summarizeTable, type ParsedTable } from "@/lib/parse-file";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputProvider,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

const SUGGESTIONS = [
  "Summarize the dataset",
  "Top 10 categories by revenue",
  "Plot line chart for the data",
  "Generate a PDF report of key findings",
];

type LoadedTableMeta = {
  tableName: string;
  fileName: string;
  rowCount: number;
  columns: { name: string; type: string }[];
  sample: Record<string, unknown>[];
};

function PageInner() {
  const duck = useDuckDB();
  const [tables, setTables] = useState<LoadedTableMeta[]>([]);
  const [input, setInput] = useState("");
  const datasetContextRef = useRef<string>("");

  const datasetContext = useMemo(() => {
    if (tables.length === 0) return "";
    return tables
      .map((t) => {
        const colLines = t.columns
          .map((c) => `  - ${c.name} (${c.type})`)
          .join("\n");
        const sampleJson = JSON.stringify(t.sample, null, 2);
        return `### Table: \`${t.tableName}\` (from ${t.fileName})
Rows: ${t.rowCount}
Columns:
${colLines}

Sample (first ${t.sample.length} rows):
\`\`\`json
${sampleJson}
\`\`\``;
      })
      .join("\n\n");
  }, [tables]);

  useEffect(() => {
    datasetContextRef.current = datasetContext;
  }, [datasetContext]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `${API_URL}/api/chat`,
        body: () => ({ datasetContext: datasetContextRef.current }),
      }),
    [],
  );

  const {
    messages,
    sendMessage,
    status,
    addToolOutput,
    error,
    regenerate,
    stop,
  } = useChat({
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    onToolCall: ({ toolCall }) => {
      if (toolCall.dynamic) return;
      if (toolCall.toolName === "execute_query") {
        const sql = (toolCall.input as { sql?: string })?.sql ?? "";
        (async () => {
          try {
            const rows = await duck.runQuery(sql);
            const capped = rows.slice(0, 200);
            addToolOutput({
              tool: "execute_query",
              toolCallId: toolCall.toolCallId,
              output: capped,
            });
          } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            addToolOutput({
              tool: "execute_query",
              toolCallId: toolCall.toolCallId,
              output: `ERROR: ${msg}`,
            });
          }
        })();
      }
    },
  });

  const onLoaded = useCallback(
    async (table: ParsedTable) => {
      await duck.loadTable(table);
      const summary = summarizeTable(table);
      setTables((prev) => {
        const filtered = prev.filter((t) => t.tableName !== summary.tableName);
        return [...filtered, summary];
      });
    },
    [duck],
  );

  const onRemove = useCallback(
    async (tableName: string) => {
      try {
        await duck.dropTable(tableName);
      } catch {
        /* non-fatal */
      }
      setTables((prev) => prev.filter((t) => t.tableName !== tableName));
    },
    [duck],
  );

  const handleSubmit = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      if (tables.length === 0) {
        alert("Upload at least one dataset first.");
        return;
      }
      sendMessage({ text: trimmed });
      setInput("");
    },
    [sendMessage, tables.length],
  );

  const isStreaming = status === "streaming" || status === "submitted";
  const canSubmit = duck.ready && tables.length > 0 && input.trim().length > 0;

  return (
    <>
      {/*
        Root: fills exactly the viewport — no overflow.
        Everything inside must stay within this box.
      */}
      <div className="h-dvh w-full flex flex-col overflow-hidden bg-background text-foreground dark">
        {/* ── Navbar — always visible, never scrolls ── */}
        <header className="shrink-0 z-20 flex items-center justify-between border-b bg-background/80 backdrop-blur-md px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-sm select-none shadow-sm">
              D
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold">DataWise</p>
              <p className="text-xs text-muted-foreground hidden sm:block">
                AI Data Analysis Agent · Browser-only execution
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant={duck.ready ? "default" : "secondary"}
              className="gap-1.5 text-xs font-normal"
            >
              <Database className="h-3 w-3" />
              <span className="hidden sm:inline">DuckDB:</span>{" "}
              {duck.ready ? "ready" : duck.error ? "error" : "loading…"}
            </Badge>
            {/*<Button variant="outline" size="sm" className="text-xs" asChild>*/}
            <Button variant="outline" size="sm" className="text-xs">
              <Link href="/prompt-studio">Prompt Studio</Link>
            </Button>
          </div>
        </header>

        {/*
          Body row: fills all remaining height after navbar.
          overflow-hidden so children manage their own scroll.
        */}
        <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
          {/* ── Sidebar ── */}
          <aside
            className="shrink-0 flex flex-col gap-4 p-4
            h-auto max-h-[40vh] overflow-y-auto
            lg:h-full lg:max-h-full lg:w-72 xl:w-80 lg:overflow-hidden
            border-b lg:border-b-0 lg:border-r bg-muted/20 custom-scrollbar"
          >
            <FileUpload
              onLoaded={onLoaded}
              onRemove={onRemove}
              loadedTables={tables.map((t) => ({
                tableName: t.tableName,
                fileName: t.fileName,
                rowCount: t.rowCount,
              }))}
              disabled={!duck.ready}
            />

            {tables.length > 0 && (
              <Card className="flex flex-col p-0 gap-0 lg:flex-1 lg:overflow-hidden">
                <CardHeader className="px-4 py-3 shrink-0">
                  <CardTitle className="text-sm font-semibold">
                    Schema
                  </CardTitle>
                </CardHeader>
                <Separator />
                <ScrollArea className="flex-1 custom-scrollbar">
                  <div className="px-4 py-3 space-y-3">
                    {tables.map((t) => (
                      <details key={t.tableName} className="group">
                        <summary className="cursor-pointer text-xs font-mono font-medium select-none list-none flex items-center gap-1.5 text-foreground hover:text-muted-foreground transition-colors">
                          <span className="text-muted-foreground group-open:rotate-90 transition-transform inline-block w-2">
                            ›
                          </span>
                          {t.tableName}
                        </summary>
                        <ul className="ml-4 mt-1.5 space-y-1 border-l pl-3">
                          {t.columns.map((c) => (
                            <li
                              key={c.name}
                              className="text-xs text-muted-foreground flex items-baseline gap-1.5"
                            >
                              <span className="text-foreground font-medium">
                                {c.name}
                              </span>
                              <span className="text-[10px]">({c.type})</span>
                            </li>
                          ))}
                        </ul>
                      </details>
                    ))}
                  </div>
                </ScrollArea>
              </Card>
            )}
          </aside>

          {/*
            Chat column: flex-col, fills remaining space.
            Messages scroll. Footer is always pinned at the bottom.
          */}
          <main className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden">
            {/* Messages — scrollable, fills all space above footer */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <Conversation className="h-full w-full custom-scrollbar">
                <ConversationContent className="w-full min-w-0 overflow-x-hidden mx-auto max-w-3xl px-4 py-6">
                  {messages.length === 0 && (
                    <ConversationEmptyState
                      icon={
                        <Sparkles className="size-10 text-muted-foreground" />
                      }
                      title="Welcome to DataWise"
                      description="Upload a CSV or XLSX file on the left, then ask anything about your data."
                    />
                  )}

                  {messages.map((m) => (
                    <Message key={m.id} message={m} />
                  ))}

                  {status === "submitted" && (
                    <div className="flex items-center gap-2 px-1 py-2 text-xs text-muted-foreground">
                      <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground" />
                      Thinking…
                    </div>
                  )}

                  {error && (
                    <div className="flex items-center justify-between rounded-md border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
                      <span>Error: {error.message}</span>
                      <Button
                        onClick={() => regenerate()}
                        size="sm"
                        variant="outline"
                        className="ml-3 shrink-0 h-7"
                      >
                        Retry
                      </Button>
                    </div>
                  )}
                </ConversationContent>
                <ConversationScrollButton />
              </Conversation>
            </div>

            {/* ── Footer — always pinned at bottom of chat column ── */}
            <div className="shrink-0 border-t bg-background/95 backdrop-blur-sm">
              <div className="mx-auto max-w-3xl w-full px-4 pt-3 pb-4 space-y-2.5">
                {/* Suggestion chips */}
                {messages.length === 0 && tables.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map((s) => (
                      <Button
                        key={s}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 rounded-full font-normal text-muted-foreground hover:text-foreground"
                        onClick={() => handleSubmit(s)}
                      >
                        {s}
                      </Button>
                    ))}
                  </div>
                )}

                {/* ── Input — matches demo UI (textarea + submit/stop only) ── */}
                <PromptInputProvider>
                  <PromptInput
                    onSubmit={(msg: PromptInputMessage) => {
                      handleSubmit(msg.text ?? "");
                    }}
                  >
                    <PromptInputBody>
                      <PromptInputTextarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={
                          tables.length === 0
                            ? "Upload a dataset first…"
                            : "Ask a question about your data…"
                        }
                        disabled={!duck.ready || tables.length === 0}
                      />
                    </PromptInputBody>
                    <PromptInputFooter>
                      {/* Empty div pushes submit to the right, matching demo's flex layout */}
                      <div />
                      <PromptInputSubmit
                        disabled={!canSubmit && !isStreaming}
                        status={isStreaming ? "streaming" : "ready"}
                        onClick={(e) => {
                          if (isStreaming) {
                            e.preventDefault();
                            stop();
                          }
                        }}
                      />
                    </PromptInputFooter>
                  </PromptInput>
                </PromptInputProvider>

                <p className="text-[10px] text-center text-muted-foreground">
                  DataWise can make mistakes. Verify important results.
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

export default function Page() {
  return <PageInner />;
}
