"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/use-store";
import {
  fetchDevices,
  toggleDevice,
  deleteDevice,
} from "@/store/slices/devices-slice";

export function useDevices() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((s) => s.devices);

  useEffect(() => {
    if (items.length === 0 && !loading) {
      dispatch(fetchDevices());
    }
  }, [dispatch, items.length, loading]);

  return {
    devices: items,
    loading,
    error,
    refresh: () => dispatch(fetchDevices()),
    toggle: (id: string, isActive: boolean) =>
      dispatch(toggleDevice({ id, isActive })),
    remove: (id: string) => dispatch(deleteDevice(id)),
  };
}
