"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DeviceCard } from "./device-card";
import { useDevices } from "@/hooks/use-devices";
import { computeMonthlyKwh } from "@/lib/types";

interface DeviceListProps {
  onAddClick: () => void;
}

export function DeviceList({ onAddClick }: DeviceListProps) {
  const { devices, loading, toggle, remove } = useDevices();

  const activeCount = devices.filter((d) => d.isActive).length;
  const totalKwh = devices
    .filter((d) => d.isActive)
    .reduce((sum, d) => sum + computeMonthlyKwh(d), 0);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 統計列 + 新增按鈕 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {devices.length > 0 ? (
            <>
              {activeCount} / {devices.length} 台啟用中
              <span className="mx-2">·</span>
              月用電 {Math.round(totalKwh).toLocaleString()} kWh
            </>
          ) : null}
        </div>
        <Button size="sm" onClick={onAddClick}>
          <Plus className="mr-1 h-4 w-4" />
          新增設備
        </Button>
      </div>

      {/* 設備列表 */}
      {devices.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          <p className="font-medium">尚未新增任何設備</p>
          <p className="mt-1 text-sm">點擊上方按鈕新增你的家電設備</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {devices.map((device) => (
            <DeviceCard
              key={device.id}
              device={device}
              onToggle={toggle}
              onDelete={remove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
