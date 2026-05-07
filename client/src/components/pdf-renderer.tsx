"use client";

import { useEffect, useRef, useState } from "react";
import { Sandpack } from "@codesandbox/sandpack-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Loader2, XCircle } from "lucide-react";

type Props = {
  title: string;
  filename: string;
  code: string;
  onComplete?: (status: "ok" | "error", message?: string) => void;
};

export function PdfRenderer({ title, filename, code, onComplete }: Props) {
  const [status, setStatus] = useState<"building" | "ready" | "error">(
    "building",
  );
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Store the blob URL once the sandbox generates the PDF
  const blobUrlRef = useRef<string | null>(null);
  const receivedRef = useRef(false);

  // Listen for the PDF from the sandbox
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const data = e.data as
        | {
            type?: string;
            dataUrl?: string;
            filename?: string;
            message?: string;
          }
        | undefined;

      if (!data || typeof data !== "object") return;

      if (data.type === "pdf-ready" && typeof data.dataUrl === "string") {
        if (receivedRef.current) return;
        receivedRef.current = true;

        // Just store it — don't auto-download
        blobUrlRef.current = data.dataUrl;
        setStatus("ready");
        onComplete?.("ok");
      } else if (data.type === "pdf-error") {
        setStatus("error");
        setErrorMessage(data.message || "PDF generation failed.");
        onComplete?.("error", data.message);
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [filename, onComplete]);

  function handleDownload() {
    if (!blobUrlRef.current) return;
    const a = document.createElement("a");
    a.href = blobUrlRef.current;
    a.download = filename || "report.pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  const files: Record<string, string> = {
    "/App.js": code,
    "/index.js": `
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
const root = createRoot(document.getElementById('root'));
root.render(<App />);`,
    "/public/index.html": `<!doctype html><html><head><meta charset="utf-8"/></head><body style="margin:0"><div id="root"></div></body></html>`,
  };

  return (
    <>
      <Card className="w-full">
        <CardContent className="flex items-center justify-between px-4 py-3">
          {/* icon and name */}
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{title}</p>
              <p className="text-xs text-muted-foreground truncate">
                {filename}
              </p>
            </div>
          </div>

          {/* status / button */}
          <div className="shrink-0 ml-4">
            {status === "building" && (
              <Button size="sm" variant="outline" disabled>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                {/*{pdfReady ? "Generating…" : "Warming…"}*/}
                {"Generating…"}
              </Button>
            )}

            {status === "ready" && (
              <Button size="sm" variant="outline" onClick={handleDownload}>
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>
            )}

            {status === "error" && (
              <div className="flex items-center gap-1 text-xs text-destructive">
                <XCircle className="h-3 w-3" />
                <span title={errorMessage}>Failed</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Hidden sandbox which runs silently withour showing code */}
      <div
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          opacity: 0,
          pointerEvents: "none",
        }}
        aria-hidden
      >
        <Sandpack
          template="react"
          files={files}
          customSetup={{
            dependencies: {
              react: "^18.2.0",
              "react-dom": "^18.2.0",
              jspdf: "^2.5.2",
              "jspdf-autotable": "^3.8.4",
              d3: "^7.9.0",
            },
          }}
          options={{
            showNavigator: false,
            showTabs: false,
            showLineNumbers: false,
            showInlineErrors: false,
            showConsole: false,
            editorHeight: 0,
            editorWidthPercentage: 0,
            autorun: true,
          }}
          theme="dark"
        />
      </div>
    </>
  );
}
