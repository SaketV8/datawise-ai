"use client";

import { useEffect, useRef, useState } from "react";
import { Sandpack } from "@codesandbox/sandpack-react";

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
  const [message, setMessage] = useState<string>("Generating PDF…");
  const downloadedRef = useRef(false);

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
        if (downloadedRef.current) return;
        downloadedRef.current = true;
        const a = document.createElement("a");
        a.href = data.dataUrl;
        a.download = data.filename || filename || "report.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
        setStatus("ready");
        setMessage("PDF downloaded.");
        onComplete?.("ok");
      } else if (data.type === "pdf-error") {
        setStatus("error");
        setMessage(data.message || "PDF generation failed.");
        onComplete?.("error", data.message);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [filename, onComplete]);

  const files: Record<string, string> = {
    "/App.js": code,
    "/index.js": `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
const root = createRoot(document.getElementById('root'));
root.render(<App />);`,
    "/public/index.html": `<!doctype html><html><head><meta charset="utf-8"/></head><body style="margin:0"><div id="root"></div></body></html>`,
  };

  return (
    <div className="card p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">📄 {title}</div>
        <span
          className={`text-xs ${
            status === "ready"
              ? "text-green-400"
              : status === "error"
                ? "text-red-400"
                : "text-gray-400"
          }`}
        >
          {status === "building"
            ? "Building…"
            : status === "ready"
              ? "Done"
              : "Error"}
        </span>
      </div>
      <div className="text-xs text-gray-400">{message}</div>

      {/* Hidden sandbox — runs silently. */}
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
          // template="react"
          template="react-ts"
          files={files}
          customSetup={{
            dependencies: {
              // react: "^18.2.0",
              // "react-dom": "^18.2.0",
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
    </div>
  );
}
