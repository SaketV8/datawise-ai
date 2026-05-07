"use client";

import { forwardRef } from "react";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
} from "@codesandbox/sandpack-react";
import { buildWrapperApp } from "./iframe-response";
import SandpackWithLoader from "./sandpack-with-loader";
import escapeHtml from "@/utils/escape-html";

type ChartContentProps = {
  title: string;
  code: string;
  fullHeight?: boolean;
  showCode?: boolean;
};

export const ChartContent = forwardRef<HTMLDivElement, ChartContentProps>(
  function ChartContent({ title, code, fullHeight = false, showCode }, ref) {
    // const innerRef = useRef<HTMLDivElement>(null);

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
            {/*<SandpackWithLoader containerRef={innerRef} />*/}
            <SandpackWithLoader />
          </SandpackLayout>
        </SandpackProvider>
      </div>
    );
  },
);
