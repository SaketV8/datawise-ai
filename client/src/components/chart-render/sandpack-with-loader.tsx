import { SandpackPreview } from "@codesandbox/sandpack-react";
import { useEffect, useState } from "react";
import ChartLoader from "./chart-loader";

const SandpackWithLoader = () => {
  const [ready, setReady] = useState(false);
  const [showLoader, setShowLoader] = useState(true);

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
      {/*<SandpackPreview*/}
      <SandpackPreview
        showNavigator={false}
        showOpenInCodeSandbox={false}
        // showRefreshButton={false}
        style={{ height: "100%", width: "100%", flex: "1 1 auto", minWidth: 0 }}
      />
      {/*{!ready && <ChartLoader />}*/}
      {!ready && showLoader && (
        // <ChartLoader onShowDetails={() => setShowLoader(false)} />
        <ChartLoader onShowDetails={() => setShowLoader(false)} />
      )}
    </div>
  );
};

export default SandpackWithLoader;
