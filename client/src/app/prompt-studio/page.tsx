"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  FileText,
  Loader2,
  RotateCcw,
  Save,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

type Prompts = Record<string, string>;

export default function PromptStudio() {
  const [prompts, setPrompts] = useState<Prompts>({});
  const [activeKey, setActiveKey] = useState<string>("");
  const [draft, setDraft] = useState<string>("");
  const [filter, setFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/prompts`);
        if (!res.ok) throw new Error(`Failed to load prompts (${res.status})`);
        const data = (await res.json()) as Prompts;
        setPrompts(data);
        const first = Object.keys(data)[0] ?? "";
        setActiveKey(first);
        setDraft(data[first] ?? "");
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const isDirty = activeKey ? draft !== (prompts[activeKey] ?? "") : false;

  const filteredKeys = useMemo(() => {
    const keys = Object.keys(prompts);
    if (!filter.trim()) return keys;
    const q = filter.toLowerCase();
    return keys.filter((k) => k.toLowerCase().includes(q));
  }, [prompts, filter]);

  const charCount = draft.length;
  const lineCount = draft ? draft.split("\n").length : 0;

  function selectKey(key: string) {
    if (isDirty) {
      const ok = window.confirm(
        "You have unsaved changes. Discard and switch?",
      );
      if (!ok) return;
    }
    setActiveKey(key);
    setDraft(prompts[key] ?? "");
    setSavedAt(null);
    setError(null);
  }

  async function save() {
    if (!activeKey) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/prompts/${activeKey}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: draft }),
      });
      if (!res.ok) throw new Error(await res.text());
      setPrompts((p) => ({ ...p, [activeKey]: draft }));
      setSavedAt(Date.now());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setDraft(prompts[activeKey] ?? "");
    setSavedAt(null);
  }

  // Cmd/Ctrl + S to save
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (isDirty && !saving) save();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty, saving, draft, activeKey]);

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col dark">
      {/* Header */}
      <header className="border-border bg-background/80 sticky top-0 z-10 flex items-center justify-between border-b px-6 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          {/*<Button asChild variant="ghost" size="sm" className="gap-2">*/}
          <Button variant="ghost" size="sm" className="gap-2">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <div className="flex items-center gap-2">
            <div className="bg-primary/15 text-primary flex h-7 w-7 items-center justify-center rounded-md">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm leading-tight font-semibold">
                Prompt Studio
              </div>
              <div className="text-muted-foreground text-[11px] leading-tight">
                Edit live system prompts
              </div>
            </div>
          </div>
        </div>

        <Badge variant="outline" className="text-muted-foreground font-normal">
          In-memory · resets on server restart
        </Badge>
      </header>

      {/* Body */}
      <div className="mx-auto grid w-full max-w-[1400px] flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-[280px_1fr]">
        {/* Sidebar */}
        <Card className="flex flex-col overflow-hidden p-0">
          <CardHeader className="space-y-3 p-3 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Prompts</CardTitle>
              <Badge variant="secondary" className="font-mono text-[10px]">
                {Object.keys(prompts).length}
              </Badge>
            </div>
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
              <Input
                placeholder="Filter…"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="h-8 pl-8 text-sm"
              />
            </div>
          </CardHeader>
          <Separator />
          <ScrollArea className="custom-scrollbar flex-1">
            <div className="space-y-1 p-2">
              {loading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}

              {!loading && filteredKeys.length === 0 && (
                <div className="text-muted-foreground px-3 py-6 text-center text-xs">
                  No prompts match.
                </div>
              )}

              {!loading &&
                filteredKeys.map((k) => {
                  const isActive = activeKey === k;
                  const dirty = isActive && isDirty;
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => selectKey(k)}
                      className={cn(
                        "group flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left font-mono text-xs transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      )}
                    >
                      <span className="truncate">{k}</span>
                      {dirty && (
                        <span
                          className="bg-primary-foreground h-1.5 w-1.5 shrink-0 rounded-full"
                          aria-label="Unsaved changes"
                        />
                      )}
                    </button>
                  );
                })}
            </div>
          </ScrollArea>
        </Card>

        {/* Editor */}
        <Card className="flex flex-col overflow-hidden p-0">
          <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 p-4 pb-3">
            <div className="min-w-0">
              <CardTitle className="truncate font-mono text-sm">
                {activeKey || "—"}
              </CardTitle>
              <CardDescription className="text-[11px]">
                {isDirty ? (
                  <span className="text-amber-400">Unsaved changes</span>
                ) : savedAt ? (
                  <span className="inline-flex items-center gap-1 text-emerald-400">
                    <Check className="h-3 w-3" />
                    Saved at {new Date(savedAt).toLocaleTimeString()}
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    Edits apply immediately on the next chat request
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={reset}
                disabled={saving || !isDirty}
                className="gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={save}
                disabled={saving || !activeKey || !isDirty}
                className="gap-1.5"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="flex flex-1 flex-col gap-3 p-4">
            {loading ? (
              <Skeleton className="min-h-[60vh] flex-1" />
            ) : (
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                spellCheck={false}
                disabled={loading || !activeKey}
                placeholder="Write your prompt…"
                className="custom-scrollbar bg-background/50 min-h-[60vh] flex-1 resize-none font-mono text-xs leading-relaxed"
              />
            )}

            {error && (
              <Alert variant="destructive">
                <AlertTitle>Something went wrong</AlertTitle>
                <AlertDescription className="break-words">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="text-muted-foreground flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-3">
                <span>{lineCount.toLocaleString()} lines</span>
                <Separator orientation="vertical" className="h-3" />
                <span>{charCount.toLocaleString()} chars</span>
              </div>
              <kbd className="bg-muted text-muted-foreground rounded border px-1.5 py-0.5 font-mono text-[10px]">
                ⌘ S to save
              </kbd>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
