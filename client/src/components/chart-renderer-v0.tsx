"use client";

import { useState } from "react";
import { Sandpack } from "@codesandbox/sandpack-react";

type Props = {
  title: string;
  code: string;
};

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      (
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        }) as Record<string, string>
      )[c]!,
  );
}

export function ChartRenderer({ title, code }: Props) {
  const [showCode, setShowCode] = useState(false);

  const files: Record<string, string> = {
    "/App.js": code,
    "/index.js": `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
const root = createRoot(document.getElementById('root'));
root.render(<App />);`,
    "/public/index.html": `<!doctype html><html><head><meta charset="utf-8"/><title>${escapeHtml(
      title,
    )}</title></head><body style="margin:0;background:#fff"><div id="root"></div></body></html>`,
  };

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-3 py-2">
        <div className="text-sm font-medium">📊 {title}</div>
        <button
          type="button"
          className="btn btn-sm bg-red-600"
          onClick={() => setShowCode((v) => !v)}
        >
          {showCode ? "Hide code" : "View code"}
        </button>
      </div>

      <div className="bg-white">
        <Sandpack
          template="react"
          files={files}
          customSetup={{
            dependencies: {
              react: "^18.2.0",
              "react-dom": "^18.2.0",
              d3: "^7.9.0",
            },
          }}
          options={{
            showNavigator: false,
            showTabs: false,
            showLineNumbers: false,
            showInlineErrors: true,
            editorHeight: showCode ? 360 : 0,
            editorWidthPercentage: showCode ? 40 : 0,
          }}
          theme="dark"
        />
      </div>
    </div>
  );
}
