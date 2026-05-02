'use client';

import { useRef, useState } from 'react';
import { parseFile, summarizeTable, type ParsedTable } from '@/lib/parse-file';

type Props = {
  onLoaded: (
    table: ParsedTable,
    summary: ReturnType<typeof summarizeTable>,
  ) => Promise<void> | void;
  loadedTables: { tableName: string; fileName: string; rowCount: number }[];
  onRemove: (tableName: string) => void;
  disabled?: boolean;
};

export function FileUpload({
  onLoaded,
  loadedTables,
  onRemove,
  disabled,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setBusy(true);
    try {
      for (const f of Array.from(files)) {
        const table = await parseFile(f);
        const summary = summarizeTable(table);
        await onLoaded(table, summary);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Datasets</h2>
        <span className="text-xs text-gray-400">CSV · XLSX</span>
      </div>

      <label
        className={`flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-[var(--color-border)] p-6 text-center transition hover:border-[var(--color-accent)] ${
          disabled || busy ? 'pointer-events-none opacity-50' : ''
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".csv,.tsv,.xlsx,.xls"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          disabled={disabled || busy}
        />
        <div className="text-sm">{busy ? 'Loading…' : 'Click or drop files here'}</div>
        <div className="mt-1 text-xs text-gray-500">
          Files are parsed locally and loaded into DuckDB-WASM.
        </div>
      </label>

      {error && <div className="text-xs text-red-400">{error}</div>}

      {loadedTables.length > 0 && (
        <ul className="space-y-1.5">
          {loadedTables.map((t) => (
            <li
              key={t.tableName}
              className="flex items-center justify-between rounded-md border border-[var(--color-border)] bg-[#0e1115] px-2.5 py-1.5"
            >
              <div className="min-w-0">
                <div className="truncate text-xs font-medium">{t.fileName}</div>
                <div className="text-[10px] text-gray-500">
                  <span className="font-mono">{t.tableName}</span> ·{' '}
                  {t.rowCount.toLocaleString()} rows
                </div>
              </div>
              <button
                onClick={() => onRemove(t.tableName)}
                className="px-1 text-xs text-gray-400 hover:text-red-400"
                aria-label="Remove"
                type="button"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}