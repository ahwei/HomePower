"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { WeatherForecast } from "@/lib/types";
import { useAppSelector } from "@/hooks/use-store";

const POLL_INTERVAL = 3_600_000; // 1 小時
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

export function useWeather() {
  const location = useAppSelector((s) => s.settings.location);
  const [data, setData] = useState<WeatherForecast[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const retryCount = useRef(0);

  const fetchWeather = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/weather?location=${encodeURIComponent(location)}`
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const json = await res.json();
      setData(json.forecasts ?? []);
      setError(null);
      retryCount.current = 0;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "未知錯誤";
      setError(msg);

      // 自動重試
      if (retryCount.current < MAX_RETRIES) {
        retryCount.current += 1;
        setTimeout(fetchWeather, RETRY_DELAY * retryCount.current);
      }
    } finally {
      setIsLoading(false);
    }
  }, [location]);

  useEffect(() => {
    fetchWeather();
    const id = setInterval(fetchWeather, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchWeather]);

  return { data, isLoading, error };
}
