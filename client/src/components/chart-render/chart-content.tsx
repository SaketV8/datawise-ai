"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackPreview,
  SandpackCodeEditor,
} from "@codesandbox/sandpack-react";
// import { Loader2 } from "lucide-react";
import ChartLoader from "./chart-loader";
// import buildWrapperApp from "./iframe-response";

type ChartContentProps = {
  title: string;
  code: string;
  fullHeight?: boolean;
  showCode?: boolean;
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

function buildWrapperApp(): string {
  return `
import { useEffect } from "react";
import OriginalApp from "./UserChart";

export default function App() {
  useEffect(() => {
    // Signal parent that the chart has actually rendered
    window.parent.postMessage({ type: 'CHART_READY' }, '*');

    function handleMessage(e) {
      if (e.data?.type !== 'REQUEST_SVG') return;
      const svg = document.querySelector('svg');
      if (!svg) {
        window.parent.postMessage({
          type: 'SVG_RESPONSE',
          requestId: e.data.requestId,
          error: 'No SVG found'
        }, '*');
        return;
      }
      const source = new XMLSerializer().serializeToString(svg);
      window.parent.postMessage({
        type: 'SVG_RESPONSE',
        requestId: e.data.requestId,
        svg: source
      }, '*');
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return <OriginalApp />;
}
`;
}

function SandpackWithLoader({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLDivElement>;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      // Only mark ready when our wrapper App signals it has mounted
      if (e.data?.type === "CHART_READY") {
        setReady(true);
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        width: "100%",
        flex: "1 1 auto",
        minWidth: 0,
      }}
    >
      <SandpackPreview
        showNavigator={false}
        showOpenInCodeSandbox={false}
        showRefreshButton={false}
        style={{ height: "100%", width: "100%", flex: "1 1 auto", minWidth: 0 }}
      />
      {!ready && <ChartLoader />}
    </div>
  );
}

export const ChartContent = forwardRef<HTMLDivElement, ChartContentProps>(
  function ChartContent({ title, code, fullHeight = false, showCode }, ref) {
    const innerRef = useRef<HTMLDivElement>(null);

    const files: Record<string, string> = {
      "/UserChart.js": code,
      "/App.js": buildWrapperApp(),
      "/index.js": `
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
const root = createRoot(document.getElementById('root'));
root.render(<App />);`,
      "/public/index.html": `<!doctype html><html><head><meta charset="utf-8"/><title>${escapeHtml(title)}</title></head><body style="margin:0;background:#fff"><div id="root"></div></body></html>`,
    };

    return (
      <div
        ref={ref}
        className={`w-full min-w-0 bg-white ${fullHeight ? "h-full" : ""}`}
      >
        <SandpackProvider
          template="react"
          files={files}
          customSetup={{ dependencies: { d3: "^7.9.0" } }}
          style={{ height: fullHeight ? "100%" : "500px", width: "100%" }}
        >
          <SandpackLayout
            style={{
              height: "100%",
              width: "100%",
              border: "none",
              borderRadius: 0,
            }}
          >
            {showCode && <SandpackCodeEditor />}
            <SandpackWithLoader containerRef={innerRef} />
          </SandpackLayout>
        </SandpackProvider>
      </div>
    );
  },
);
