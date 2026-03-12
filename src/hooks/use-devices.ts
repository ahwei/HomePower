"use client";

import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/use-store";
import {
  fetchDevices,
  toggleDevice,
  deleteDevice,
} from "@/store/slices/devices-slice";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1500;

export function useDevices() {
  const dispatch = useAppDispatch();
  const { items, loading, error, fetched } = useAppSelector((s) => s.devices);
  const retryCount = useRef(0);

  useEffect(() => {
    if (fetched || loading) return;

    if (!error) {
      // 首次載入
      dispatch(fetchDevices());
    } else if (retryCount.current < MAX_RETRIES) {
      // 失敗後延遲重試
      const timer = setTimeout(() => {
        retryCount.current += 1;
        dispatch(fetchDevices());
      }, RETRY_DELAY);
      return () => clearTimeout(timer);
    }
  }, [dispatch, fetched, loading, error]);

  return {
    devices: items,
    loading,
    error,
    refresh: () => {
      retryCount.current = 0;
      dispatch(fetchDevices());
    },
    toggle: (id: string, isActive: boolean) =>
      dispatch(toggleDevice({ id, isActive })),
    remove: (id: string) => dispatch(deleteDevice(id)),
  };
}
