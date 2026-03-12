"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useGridStatus } from "@/hooks/use-grid-status";
import { Skeleton } from "@/components/ui/skeleton";
import type { GridStatus, GridStatusLevel } from "@/lib/types";

const STATUS_CONFIG: Record<
  GridStatusLevel,
  { label: string; color: string; barColor: string }
> = {
  green: { label: "供電充裕", color: "bg-green-500", barColor: "bg-green-500" },
  yellow: { label: "供電警戒", color: "bg-yellow-500", barColor: "bg-yellow-500" },
  orange: { label: "供電吃緊", color: "bg-orange-500", barColor: "bg-orange-500" },
  red: { label: "限電警報", color: "bg-red-500", barColor: "bg-red-500" },
};

function CapacityBar({
  label,
  value,
  max,
  unit,
  barColor,
}: {
  label: string;
  value: number;
  max: number;
  unit: string;
  barColor: string;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">
          {value.toLocaleString()} {unit}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-lg font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function DetailPanel({ data }: { data: GridStatus }) {
  const config = STATUS_CONFIG[data.status];

  return (
    <div className="space-y-4 pt-3">
      {/* 供電量條 */}
      <CapacityBar
        label="即時用電負載"
        value={data.currentLoadMW}
        max={data.supplyCapacityMW}
        unit="MW"
        barColor={config.barColor}
      />
      <CapacityBar
        label="預估尖峰負載"
        value={data.forecastPeakLoadMW}
        max={data.supplyCapacityMW}
        unit="MW"
        barColor="bg-amber-500"
      />
      <CapacityBar
        label="最大供電能力"
        value={data.supplyCapacityMW}
        max={data.supplyCapacityMW}
        unit="MW"
        barColor="bg-blue-500"
      />

      {/* 關鍵數據 */}
      <div className="grid grid-cols-4 gap-3 rounded-lg bg-muted/50 p-3">
        <StatItem
          label="使用率"
          value={`${data.usagePercent}%`}
        />
        <StatItem
          label="備轉容量"
          value={`${data.reserveCapacityMW} MW`}
        />
        <StatItem
          label="備轉容量率"
          value={`${data.reserveMarginPercent}%`}
        />
        <StatItem
          label="尖峰時段"
          value={data.peakHourRange || "-"}
        />
      </div>

      {/* 昨日比較 */}
      <div className="flex items-center justify-between rounded-lg border border-dashed p-3 text-sm">
        <span className="text-muted-foreground">昨日尖峰</span>
        <div className="flex gap-4 tabular-nums">
          <span>負載 {data.yesterday.peakLoadMW.toLocaleString()} MW</span>
          <span>供電 {data.yesterday.supplyCapacityMW.toLocaleString()} MW</span>
          <span>備轉 {data.yesterday.reserveRate}%</span>
        </div>
      </div>

      {data.publishTime && (
        <p className="text-right text-xs text-muted-foreground">
          台電發布時間：{data.publishTime}
        </p>
      )}
    </div>
  );
}

export function GridStatusBanner() {
  const { data, isLoading, error } = useGridStatus();
  const [open, setOpen] = useState(false);

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
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        data-testid="grid-status-banner"
        className="rounded-lg border p-4"
        aria-label={`台電供電狀態：${config.label}，備轉容量率 ${data.reserveMarginPercent}%`}
      >
        <CollapsibleTrigger className="flex w-full items-center gap-3 text-left">
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
          <span className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            {new Date(data.updatedAt).toLocaleTimeString("zh-TW")}
            <ChevronDown
              className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
            />
          </span>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <DetailPanel data={data} />
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
