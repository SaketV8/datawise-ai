import Papa from "papaparse";
import * as XLSX from "xlsx";

export type ParsedCSV = {
  kind: "csv";
  tableName: string;
  fileName: string;
  /** Raw file text — handed directly to DuckDB's CSV reader. */
  text: string;
  /** Parsed rows (sample only, used for schema preview). */
  sampleRows: Record<string, unknown>[];
  columns: string[];
  rowCount: number;
};

export type ParsedXLSX = {
  kind: "xlsx";
  tableName: string;
  fileName: string;
  rows: Record<string, unknown>[];
  columns: string[];
  rowCount: number;
};

export type ParsedTable = ParsedCSV | ParsedXLSX;

export function sanitizeTableName(fileName: string): string {
  const base =
    fileName
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, "_")
      .replace(/^_+|_+$/g, "") || "data";
  return /^\d/.test(base) ? `_${base}` : base;
}

export async function parseFile(file: File): Promise<ParsedTable> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  const tableName = sanitizeTableName(file.name);

  if (ext === "csv" || ext === "tsv") {
    const text = await file.text();
    // Parse a small slice for schema/sample preview only.
    const preview = Papa.parse<Record<string, unknown>>(text, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      delimiter: ext === "tsv" ? "\t" : undefined,
      preview: 200,
    });
    const sampleRows = (preview.data ?? []).slice(0, 5);
    const columns = preview.meta.fields ?? Object.keys(sampleRows[0] ?? {});

    // Cheap row-count: count newlines in the text minus header.
    const rowCount = Math.max(0, (text.match(/\n/g)?.length ?? 0) - 1);

    return {
      kind: "csv",
      tableName,
      fileName: file.name,
      text,
      sampleRows,
      columns,
      rowCount,
    };
  }

  if (ext === "xlsx" || ext === "xls") {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheetName = wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: null,
    });
    const columns = rows[0] ? Object.keys(rows[0]) : [];
    return {
      kind: "xlsx",
      tableName,
      fileName: file.name,
      rows,
      columns,
      rowCount: rows.length,
    };
  }

  throw new Error(
    `Unsupported file type: .${ext}. Only CSV and XLSX are supported.`,
  );
}

export function summarizeTable(t: ParsedTable, sampleSize = 5) {
  const sample =
    t.kind === "csv"
      ? t.sampleRows.slice(0, sampleSize)
      : t.rows.slice(0, sampleSize);

  const colTypes: Record<string, string> = {};
  const probeRows = t.kind === "csv" ? t.sampleRows : t.rows;
  for (const col of t.columns) {
    const v = probeRows.find((r) => r[col] !== null && r[col] !== undefined)?.[
      col
    ];
    colTypes[col] = inferType(v);
  }

  return {
    tableName: t.tableName,
    fileName: t.fileName,
    rowCount: t.rowCount,
    columns: t.columns.map((c) => ({
      name: c,
      type: colTypes[c] ?? "unknown",
    })),
    sample,
  };
}

function inferType(v: unknown): string {
  if (v === null || v === undefined) return "unknown";
  if (typeof v === "number") return Number.isInteger(v) ? "integer" : "double";
  if (typeof v === "boolean") return "boolean";
  if (v instanceof Date) return "timestamp";
  if (typeof v === "string") {
    if (!isNaN(Date.parse(v)) && /\d{4}-\d{2}-\d{2}/.test(v))
      return "date-string";
    return "string";
  }
  return typeof v;
}
