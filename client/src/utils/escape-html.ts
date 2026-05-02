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

// export default escapeHtml;

const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => HTML_ESCAPE_MAP[c]);
}

export default escapeHtml;
