"use client";

import React, { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppSelector } from "@/hooks/use-store";
import { computeMonthlyKwh } from "@/lib/types";
import type { DeviceCategory } from "@/lib/types";

const CATEGORY_COLORS: Record<DeviceCategory, string> = {
  aircon: "#3b82f6",
  kitchen: "#f59e0b",
  water_heater: "#ef4444",
  laundry: "#8b5cf6",
  entertainment: "#ec4899",
  office: "#6366f1",
  lighting: "#10b981",
  ev_charging: "#14b8a6",
};

interface ChartEntry {
  name: string;
  kwh: number;
  color: string;
  percent: number;
}

export const DeviceConsumptionChart = React.memo(
  function DeviceConsumptionChart() {
    const devices = useAppSelector((s) => s.devices.items);

    const { entries, totalKwh } = useMemo(() => {
      const active = devices.filter((d) => d.isActive);
      const total = active.reduce((s, d) => s + computeMonthlyKwh(d), 0);

      const items: ChartEntry[] = active
        .map((d) => ({
          name: d.name,
          kwh: Math.round(computeMonthlyKwh(d) * 10) / 10,
          color: CATEGORY_COLORS[d.category] ?? "#94a3b8",
          percent: total > 0 ? Math.round((computeMonthlyKwh(d) / total) * 100) : 0,
        }))
        .sort((a, b) => b.kwh - a.kwh);

      return { entries: items, totalKwh: Math.round(total) };
    }, [devices]);

    if (entries.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">設備用電佔比</CardTitle>
          </CardHeader>
          <CardContent className="flex h-48 items-center justify-center text-muted-foreground">
            尚無啟用中的設備
          </CardContent>
        </Card>
      );
    }

    return (
      <Card aria-label="各設備用電佔比圖表">
        <CardHeader>
          <CardTitle className="text-sm font-medium">設備用電佔比</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="relative h-48 w-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={entries}
                    dataKey="kwh"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {entries.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`${value} kWh`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-lg font-bold">{totalKwh}</div>
                  <div className="text-xs text-muted-foreground">kWh</div>
                </div>
              </div>
            </div>

            <ul className="flex-1 space-y-1.5 text-sm">
              {entries.map((entry, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="flex-1 truncate">{entry.name}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {entry.kwh} kWh
                  </span>
                  <span className="w-10 text-right tabular-nums text-muted-foreground">
                    {entry.percent}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }
);
