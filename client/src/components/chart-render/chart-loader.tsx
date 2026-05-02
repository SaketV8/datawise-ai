// Skeleton bars version
// function ChartLoader() {
//   return (
//     <div className="w-full h-full flex flex-col items-end justify-end gap-2 p-8 bg-white">
//       {[60, 85, 45, 90, 70, 55, 80].map((h, i) => (
//         <div
//           key={i}
//           className="w-8 rounded-t bg-muted animate-pulse"
//           style={{ height: `${h}%`, animationDelay: `${i * 80}ms` }}
//         />
//       ))}
//     </div>
//   );
// }

// or a simple branded skeleton
// function ChartLoader() {
//   return (
//     <div className="w-full h-full flex flex-col gap-4 p-6 bg-white">
//       <div className="h-4 w-1/3 rounded bg-muted animate-pulse" />
//       <div className="flex-1 rounded bg-muted animate-pulse" />
//       <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
//     </div>
//   );
// }

import { Loader2 } from "lucide-react";
function ChartLoader() {
  return (
    <div
      style={{ position: "absolute", inset: 0, zIndex: 10 }}
      className="flex flex-col items-center justify-center gap-3 bg-white"
    >
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Rendering chart…</p>
    </div>
  );
}

export default ChartLoader;
