"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { GridStatus } from "@/lib/types";

const POLL_INTERVAL = 300_000; // 5 分鐘
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

export function useGridStatus() {
  const [data, setData] = useState<GridStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const retryCount = useRef(0);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/grid-status");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const json: GridStatus = await res.json();
      setData(json);
      setError(null);
      retryCount.current = 0;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "未知錯誤";
      setError(msg);

      // 自動重試
      if (retryCount.current < MAX_RETRIES) {
        retryCount.current += 1;
        setTimeout(fetchStatus, RETRY_DELAY * retryCount.current);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const id = setInterval(fetchStatus, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchStatus]);

  return { data, isLoading, error };
}
