// "use client";

// import { useState } from "react";
// import { Sandpack } from "@codesandbox/sandpack-react";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader } from "@/components/ui/card";
// // import { useSandpackPool } from "@/components/sandpack-pool";
// import { useSandpackPool } from "@/providers/sandpack-pool";
// import { Code2, Eye, EyeOff, Loader2 } from "lucide-react";

// type Props = {
//   title: string;
//   code: string;
// };

// function escapeHtml(s: string): string {
//   return s.replace(
//     /[&<>"']/g,
//     (c) =>
//       (
//         {
//           "&": "&amp;",
//           "<": "&lt;",
//           ">": "&gt;",
//           '"': "&quot;",
//           "'": "&#39;",
//         } as Record<string, string>
//       )[c]!,
//   );
// }

// export function ChartRenderer({ title, code }: Props) {
//   const [showCode, setShowCode] = useState(false);
//   const { chartReady } = useSandpackPool();

//   const files: Record<string, string> = {
//     "/App.js": code,
//     "/index.js": `import React from 'react';
// import { createRoot } from 'react-dom/client';
// import App from './App';
// const root = createRoot(document.getElementById('root'));
// root.render(<App />);`,
//     "/public/index.html": `<!doctype html><html><head><meta charset="utf-8"/><title>${escapeHtml(
//       title,
//     )}</title></head><body style="margin:0;background:#fff"><div id="root"></div></body></html>`,
//   };

//   return (
//     <Card className="overflow-hidden">
//       <CardHeader className="flex flex-row items-center justify-between border-b py-2 px-3 space-y-0">
//         <div className="flex items-center gap-2 text-sm font-medium">
//           📊 <span>{title}</span>
//           {!chartReady && (
//             <span className="flex items-center gap-1 text-xs text-muted-foreground">
//               <Loader2 className="h-3 w-3 animate-spin" />
//               warming sandbox…
//             </span>
//           )}
//         </div>
//         <Button
//           type="button"
//           variant="outline"
//           size="sm"
//           onClick={() => setShowCode((v) => !v)}
//         >
//           {showCode ? (
//             <>
//               <EyeOff className="mr-1 h-3 w-3" /> Hide code
//             </>
//           ) : (
//             <>
//               <Code2 className="mr-1 h-3 w-3" /> View code
//             </>
//           )}
//         </Button>
//       </CardHeader>
//       <CardContent className="p-0 bg-white">
//         <Sandpack
//           template="react"
//           // template="react-ts"
//           files={files}
//           customSetup={{
//             dependencies: {
//               // react: "^18.2.0",
//               // "react-dom": "^18.2.0",
//               d3: "^7.9.0",
//             },
//           }}
//           options={{
//             showNavigator: false,
//             showTabs: false,
//             showLineNumbers: false,
//             showInlineErrors: true,
//             editorHeight: showCode ? 360 : 0,
//             editorWidthPercentage: showCode ? 40 : 0,
//           }}
//           theme="dark"
//         />
//       </CardContent>
//     </Card>
//   );
// }
//
// "use client";

// import { useState, useEffect, useRef } from "react";
// import { Sandpack } from "@codesandbox/sandpack-react";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader } from "@/components/ui/card";
// import { useSandpackPool } from "@/providers/sandpack-pool";
// import { Code2, EyeOff, Loader2, Download } from "lucide-react";

// type Props = {
//   title: string;
//   code: string;
// };

// function escapeHtml(s: string): string {
//   return s.replace(
//     /[&<>"']/g,
//     (c) =>
//       (
//         ({
//           "&": "&amp;",
//           "<": "&lt;",
//           ">": "&gt;",
//           '"': "&quot;",
//           "'": "&#39;",
//         }) as Record<string, string>
//       )[c]!,
//   );
// }

// export function ChartRenderer({ title, code }: Props) {
//   const [showCode, setShowCode] = useState(false);
//   const [isMobile, setIsMobile] = useState(false);
//   const { chartReady } = useSandpackPool();

//   // 🔥 ref to scope iframe properly
//   const containerRef = useRef<HTMLDivElement>(null);

//   // 📱 responsive detection
//   useEffect(() => {
//     const check = () => setIsMobile(window.innerWidth < 768);
//     check();
//     window.addEventListener("resize", check);
//     return () => window.removeEventListener("resize", check);
//   }, []);

//   const files: Record<string, string> = {
//     "/App.js": code,
//     "/index.js": `import React from 'react';
// import { createRoot } from 'react-dom/client';
// import App from './App';
// const root = createRoot(document.getElementById('root'));
// root.render(<App />);`,
//     "/public/index.html": `<!doctype html><html><head><meta charset="utf-8"/><title>${escapeHtml(
//       title,
//     )}</title></head><body style="margin:0;background:#fff"><div id="root"></div></body></html>`,
//   };

//   // 📥 Download SVG from sandbox
//   function downloadChart() {
//     try {
//       const iframe = containerRef.current?.querySelector("iframe") ?? null;

//       if (!iframe) {
//         alert("Chart not ready yet");
//         return;
//       }

//       const doc = iframe.contentDocument || iframe.contentWindow?.document;

//       if (!doc) {
//         alert("Cannot access chart");
//         return;
//       }

//       const svg = doc.querySelector("svg");

//       if (!svg) {
//         alert("No SVG chart found");
//         return;
//       }

//       const serializer = new XMLSerializer();
//       const source = serializer.serializeToString(svg);

//       const blob = new Blob([source], {
//         type: "image/svg+xml;charset=utf-8",
//       });

//       const url = URL.createObjectURL(blob);

//       const a = document.createElement("a");
//       a.href = url;
//       a.download = `${title || "chart"}.svg`;
//       a.click();

//       URL.revokeObjectURL(url);
//     } catch (err) {
//       console.error(err);
//       alert("Failed to download chart");
//     }
//   }

//   return (
//     <Card className="w-full min-w-0 overflow-hidden">
//       {/* Header */}
//       <CardHeader className="flex flex-row items-center justify-between border-b py-2 px-3 space-y-0">
//         <div className="flex items-center gap-2 text-sm font-medium">
//           📊 <span>{title}</span>
//           {!chartReady && (
//             <span className="flex items-center gap-1 text-xs text-muted-foreground">
//               <Loader2 className="h-3 w-3 animate-spin" />
//               warming sandbox…
//             </span>
//           )}
//         </div>

//         <div className="flex items-center gap-2">
//           {/* Download */}
//           <Button
//             type="button"
//             variant="outline"
//             size="sm"
//             onClick={downloadChart}
//           >
//             <Download className="mr-1 h-3 w-3" />
//             Download
//           </Button>

//           {/* Toggle code (desktop only) */}
//           {!isMobile && (
//             <Button
//               type="button"
//               variant="outline"
//               size="sm"
//               onClick={() => setShowCode((v) => !v)}
//             >
//               {showCode ? (
//                 <>
//                   <EyeOff className="mr-1 h-3 w-3" /> Hide code
//                 </>
//               ) : (
//                 <>
//                   <Code2 className="mr-1 h-3 w-3" /> View code
//                 </>
//               )}
//             </Button>
//           )}
//         </div>
//       </CardHeader>

//       {/* Content */}
//       <CardContent
//         ref={containerRef}
//         className="p-0 bg-white w-full min-w-0 overflow-x-auto"
//       >
//         <Sandpack
//           template="react"
//           files={files}
//           customSetup={{
//             dependencies: {
//               d3: "^7.9.0",
//             },
//           }}
//           options={{
//             showNavigator: false,
//             showTabs: false,
//             showLineNumbers: false,
//             showInlineErrors: true,

//             // 🔥 layout fix
//             // layout: isMobile ? "vertical" : "horizontal",

//             // editor behavior
//             editorHeight: showCode || isMobile ? 300 : 0,
//             editorWidthPercentage: showCode && !isMobile ? 40 : 0,
//           }}
//           theme="dark"
//         />
//       </CardContent>
//     </Card>
//   );
// }

"use client";

import { useState, useEffect, useRef } from "react";
// import { Sandpack } from "@codesandbox/sandpack-react";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
} from "@codesandbox/sandpack-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useSandpackPool } from "@/providers/sandpack-pool";
import { Code2, EyeOff, Loader2, Download, Maximize2, X } from "lucide-react";

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
  const [isMobile, setIsMobile] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { chartReady } = useSandpackPool();

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

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

  function downloadChart() {
    try {
      const iframe = containerRef.current?.querySelector("iframe") ?? null;

      if (!iframe) return alert("Chart not ready");

      const doc = iframe.contentDocument || iframe.contentWindow?.document;

      const svg = doc?.querySelector("svg");

      if (!svg) return alert("No SVG found");

      const source = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([source], {
        type: "image/svg+xml;charset=utf-8",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title || "chart"}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Download failed");
    }
  }

  function ChartContent() {
    return (
      <div
        ref={containerRef}
        // className="w-full min-w-0 overflow-x-auto bg-white"
        className="w-full min-w-0 bg-white"
      >
        {/*<Sandpack
          template="react"
          files={files}
          customSetup={{
            dependencies: { d3: "^7.9.0" },
          }}
          options={{
            showNavigator: false,
            showTabs: false,
            showLineNumbers: false,
            showReadOnly: true,
            showInlineErrors: true,
            // layout: isMobile ? "vertical" : "horizontal",
            editorHeight: showCode || isMobile ? 300 : 0,
            editorWidthPercentage: showCode && !isMobile ? 40 : 0,
          }}
          theme="dark"
        />*/}
        <SandpackProvider
          template="react"
          files={files}
          customSetup={{
            dependencies: { d3: "^7.9.0" },
          }}
        >
          <SandpackLayout>
            {/*<SandpackCodeEditor />*/}
            <SandpackPreview />
          </SandpackLayout>
        </SandpackProvider>
      </div>
    );
  }

  return (
    <>
      {/* Normal Card */}
      <Card className="w-full min-w-0 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b py-2 px-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            📊 {title}
            {!chartReady && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                warming…
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={downloadChart}>
              <Download className="h-3 w-3 mr-1" />
              Download
            </Button>

            {!isMobile && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowCode((v) => !v)}
              >
                {showCode ? (
                  <>
                    <EyeOff className="h-3 w-3 mr-1" />
                    Hide
                  </>
                ) : (
                  <>
                    <Code2 className="h-3 w-3 mr-1" />
                    Code
                  </>
                )}
              </Button>
            )}

            {/* 🔥 Fullscreen button */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsFullscreen(true)}
            >
              <Maximize2 className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <ChartContent />
        </CardContent>
      </Card>

      {/* 🔥 Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-2">
            <div className="font-medium">{title}</div>

            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={downloadChart}>
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>

              {!isMobile && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowCode((v) => !v)}
                >
                  {showCode ? "Hide Code" : "Show Code"}
                </Button>
              )}

              <Button
                size="sm"
                variant="destructive"
                onClick={() => setIsFullscreen(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Fullscreen Content */}
          <div className="flex-1 overflow-hidden">
            <ChartContent />
          </div>
        </div>
      )}
    </>
  );
}
