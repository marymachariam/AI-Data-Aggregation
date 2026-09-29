"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/format";
import type { FileRecord, Source, SyncLog } from "@/lib/types";

interface WorkspaceData {
  sources: Source[];
  logs: Record<string, SyncLog[]>;
  files: Record<string, FileRecord[]>;
}

const REFRESH_MS = 30_000;

export function useWorkspaceData() {
  const [data, setData] = useState<WorkspaceData>({ sources: [], logs: {}, files: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    try {
      const sources = await api.listSources();
      const entries = await Promise.all(
        sources.map(async (source) => {
          const [logs, files] = await Promise.all([
            api.getLogs(source.id).catch((): SyncLog[] => []),
            api.getFiles(source.id).catch((): FileRecord[] => []),
          ]);
          return { id: source.id, logs, files };
        }),
      );

      const logs: Record<string, SyncLog[]> = {};
      const files: Record<string, FileRecord[]> = {};
      for (const entry of entries) {
        logs[entry.id] = entry.logs;
        files[entry.id] = entry.files;
      }
      setData({ sources, logs, files });
      setError(null);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  return { ...data, loading, error, reload: load };
}