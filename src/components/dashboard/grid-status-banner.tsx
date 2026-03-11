"use client";

import { useGridStatus } from "@/hooks/use-grid-status";
import { Skeleton } from "@/components/ui/skeleton";
import type { GridStatusLevel } from "@/lib/types";

const STATUS_CONFIG: Record<
  GridStatusLevel,
  { label: string; color: string }
> = {
  green: { label: "供電充裕", color: "bg-green-500" },
  yellow: { label: "供電警戒", color: "bg-yellow-500" },
  orange: { label: "供電吃緊", color: "bg-orange-500" },
  red: { label: "限電警報", color: "bg-red-500" },
};

export function GridStatusBanner() {
  const { data, isLoading, error } = useGridStatus();

  if (isLoading) {
    return (
      <div data-testid="grid-status-banner" className="rounded-lg border p-4">
        <Skeleton className="h-6 w-full" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div
        data-testid="grid-status-banner"
        className="rounded-lg border border-dashed p-4 text-center text-muted-foreground"
      >
        資料暫時無法載入
      </div>
    );
  }

  if (!data) return null;

  const config = STATUS_CONFIG[data.status];

  return (
    <div
      data-testid="grid-status-banner"
      className="flex items-center gap-3 rounded-lg border p-4"
      aria-label={`台電供電狀態：${config.label}，備轉容量率 ${data.reserveMarginPercent}%`}
    >
      <span
        data-testid="grid-status-light"
        className={`inline-block h-3 w-3 shrink-0 rounded-full ${config.color}`}
      />
      <span data-testid="grid-status-label" className="font-medium">
        {config.label}
      </span>
      <span
        data-testid="grid-status-reserve"
        className="text-sm text-muted-foreground"
      >
        備轉容量率 {data.reserveMarginPercent}%
      </span>
      <span className="ml-auto text-xs text-muted-foreground">
        {new Date(data.updatedAt).toLocaleTimeString("zh-TW")}
      </span>
    </div>
  );
}
