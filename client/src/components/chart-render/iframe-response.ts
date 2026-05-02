const buildWrapperApp = () => {
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
};

export default buildWrapperApp;
