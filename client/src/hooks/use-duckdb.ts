"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as duckdb from "@duckdb/duckdb-wasm";
import type { ParsedTable } from "@/lib/parse-file";

type DuckDBState = {
  ready: boolean;
  error: string | null;
};

let dbSingleton: duckdb.AsyncDuckDB | null = null;
let connSingleton: duckdb.AsyncDuckDBConnection | null = null;
let initPromise: Promise<void> | null = null;

async function initDuckDB(): Promise<void> {
  if (dbSingleton && connSingleton) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
    const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

    const workerUrl = URL.createObjectURL(
      new Blob([`importScripts("${bundle.mainWorker!}");`], {
        type: "text/javascript",
      }),
    );

    const worker = new Worker(workerUrl);
    const logger = new duckdb.ConsoleLogger();
    const db = new duckdb.AsyncDuckDB(logger, worker);
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
    URL.revokeObjectURL(workerUrl);

    const conn = await db.connect();
    dbSingleton = db;
    connSingleton = conn;
  })();

  return initPromise;
}

function sqlEscape(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

/** Recursively normalise BigInt → number for JSON-safe transport. */
function normalize(value: unknown): unknown {
  if (typeof value === "bigint") {
    // Number is fine for typical analytics values. If the value overflows,
    // fall back to a string.
    return value <= BigInt(Number.MAX_SAFE_INTEGER) &&
      value >= BigInt(Number.MIN_SAFE_INTEGER)
      ? Number(value)
      : value.toString();
  }
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = normalize(v);
    }
    return out;
  }
  return value;
}

export function useDuckDB() {
  const [state, setState] = useState<DuckDBState>({
    ready: false,
    error: null,
  });
  const tablesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    initDuckDB()
      .then(() => {
        if (!cancelled) setState({ ready: true, error: null });
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setState({
            ready: false,
            error: e instanceof Error ? e.message : String(e),
          });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadTable = useCallback(async (table: ParsedTable): Promise<void> => {
    await initDuckDB();
    if (!dbSingleton || !connSingleton)
      throw new Error("DuckDB not initialized");
    const db = dbSingleton;
    const conn = connSingleton;

    const tname = sqlEscape(table.tableName);

    // Drop previous version if reloading.
    await conn.query(`DROP TABLE IF EXISTS ${tname};`);

    if (table.kind === "csv") {
      // Native CSV ingestion — fast and type-detected by DuckDB itself.
      const fsName = `${table.tableName}.csv`;
      try {
        await db.dropFile(fsName);
      } catch {
        /* ignore — file may not exist yet */
      }
      await db.registerFileText(fsName, table.text);
      await conn.insertCSVFromPath(fsName, {
        schema: "main",
        name: table.tableName,
        detect: true,
        header: true,
      });
    } else {
      // XLSX → already parsed to JSON rows in the browser.
      const fsName = `${table.tableName}.json`;
      try {
        await db.dropFile(fsName);
      } catch {
        /* ignore */
      }
      await db.registerFileText(fsName, JSON.stringify(table.rows));
      await conn.insertJSONFromPath(fsName, {
        schema: "main",
        name: table.tableName,
      });
    }

    tablesRef.current.add(table.tableName);
  }, []);

  const runQuery = useCallback(
    async (sql: string): Promise<Record<string, unknown>[]> => {
      await initDuckDB();
      if (!connSingleton) throw new Error("DuckDB not initialized");
      const result = await connSingleton.query(sql);
      const rows = result.toArray().map((r: unknown) => {
        // Apache Arrow rows have a toJSON method.
        const asJson =
          typeof (r as { toJSON?: () => unknown }).toJSON === "function"
            ? (r as { toJSON: () => unknown }).toJSON()
            : r;
        return normalize(asJson) as Record<string, unknown>;
      });
      return rows;
    },
    [],
  );

  const dropTable = useCallback(async (tableName: string): Promise<void> => {
    if (!connSingleton) return;
    await connSingleton.query(`DROP TABLE IF EXISTS ${sqlEscape(tableName)};`);
    tablesRef.current.delete(tableName);
  }, []);

  return {
    ready: state.ready,
    error: state.error,
    loadTable,
    runQuery,
    dropTable,
  };
}
