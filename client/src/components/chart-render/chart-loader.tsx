// Skeleton bars version
// function ChartLoader() {
// return (
//   <div className="w-full h-full flex flex-col items-end justify-end gap-2 p-8 bg-white">
//     {[60, 85, 45, 90, 70, 55, 80].map((h, i) => (
//       <div
//         key={i}
//         className="w-8 rounded-t bg-muted animate-pulse"
//         style={{ height: `${h}%`, animationDelay: `${i * 80}ms` }}
//       />
//     ))}
//   </div>
//   );
// }

import { Info, Loader2 } from "lucide-react";
import { Button } from "../ui/button";

type ChartLoaderProps = {
  onShowDetails: () => void;
};

function ChartLoader({ onShowDetails }: ChartLoaderProps) {
  return (
    <div
      style={{ position: "absolute", inset: 0, zIndex: 10 }}
      className="flex flex-col items-center justify-center gap-3 bg-background"
    >
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Rendering chart…</p>

      <Button
        onClick={onShowDetails}
        // className="text-xs px-3 py-1.5 rounded bg-black text-white hover:opacity-80 transition"
        variant="outline"
        size="sm"
        className="text-muted-foreground my-8"
      >
        <Info /> Show loading details
      </Button>
    </div>
  );
}

export default ChartLoader;

<Info />;
