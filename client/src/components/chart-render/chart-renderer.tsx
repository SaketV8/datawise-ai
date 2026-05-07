/* eslint-disable prefer-const */
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Code2, EyeOff, Loader2, Download, Maximize2, X } from "lucide-react";
import { ChartContent } from "./chart-content";
import { toast } from "sonner";

type Props = {
  title: string;
  code: string;
};

export function ChartRenderer({ title, code }: Props) {
  const [showCode, setShowCode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const inlineRef = useRef<HTMLDivElement>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  function downloadChart(source: "inline" | "fullscreen") {
    const container =
      source === "fullscreen" ? fullscreenRef.current : inlineRef.current;
    const iframe = container?.querySelector("iframe");

    if (!iframe) {
      // alert("Chart iframe not found");
      toast("Chart iframe not found");
      return;
    }

    const requestId = `${Date.now()}-${Math.random()}`;
    setIsDownloading(true);

    let timeoutId: ReturnType<typeof setTimeout>;

    function handleMessage(e: MessageEvent) {
      if (e.data?.type !== "SVG_RESPONSE") return;
      if (e.data?.requestId !== requestId) return;

      clearTimeout(timeoutId);
      window.removeEventListener("message", handleMessage);
      setIsDownloading(false);

      if (e.data.error) {
        // alert(e.data.error);
        toast.error(e.data.error);
        return;
      }

      const blob = new Blob([e.data.svg], {
        type: "image/svg+xml;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title || "chart"}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    }

    window.addEventListener("message", handleMessage);
    iframe.contentWindow?.postMessage({ type: "REQUEST_SVG", requestId }, "*");

    timeoutId = setTimeout(() => {
      window.removeEventListener("message", handleMessage);
      setIsDownloading(false);
      alert("Download timed out — chart may still be loading");
      toast.error("Download timed out — chart may still be loading");
    }, 5000);
  }

  return (
    <>
      {/* Normal Card */}
      <Card className="w-full min-w-0 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b py-2 px-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            📊 {title}
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={isDownloading}
              onClick={() => downloadChart("inline")}
            >
              {isDownloading ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Download className="h-3 w-3 mr-1" />
              )}
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
          <ChartContent
            ref={inlineRef}
            title={title}
            code={code}
            showCode={showCode}
          />
        </CardContent>
      </Card>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          <div className="flex items-center justify-between border-b px-4 py-2 shrink-0">
            <div className="font-medium">📊 {title}</div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={isDownloading}
                onClick={() => downloadChart("fullscreen")}
              >
                {isDownloading ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Download className="h-3 w-3 mr-1" />
                )}
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

              <Button
                size="sm"
                variant="destructive"
                onClick={() => setIsFullscreen(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* min-h-0 forces flex-1 to respect parent height */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <ChartContent
              ref={fullscreenRef}
              title={title}
              code={code}
              fullHeight
              showCode={showCode}
            />
          </div>
        </div>
      )}
    </>
  );
}
