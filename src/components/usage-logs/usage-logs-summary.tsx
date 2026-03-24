"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Zap, Calendar, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { UsageLogsSummary } from "@/lib/queries/usage-logs";

const CO2_FACTOR = 0.494; // kg CO2 / kWh

interface UsageLogsSummaryCardsProps {
  summary: UsageLogsSummary | undefined;
  isLoading: boolean;
}

export function UsageLogsSummaryCards({
  summary,
  isLoading,
}: UsageLogsSummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-7 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!summary) return null;

  const co2Kg = Math.round(summary.totalKwh * CO2_FACTOR * 100) / 100;

  const stats = [
    {
      label: "總用電量",
      value: `${summary.totalKwh.toLocaleString()} kWh`,
      icon: Zap,
    },
    {
      label: "日均用電",
      value: `${summary.avgDailyKwh.toLocaleString()} kWh`,
      icon: TrendingDown,
    },
    {
      label: "統計天數",
      value: `${summary.days} 天`,
      icon: Calendar,
    },
    {
      label: "碳排放量",
      value: `${co2Kg.toLocaleString()} kg`,
      icon: Zap,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {stats.map((s) => (
        <Card key={s.label}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <s.icon className="h-4 w-4" />
              {s.label}
            </div>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {s.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
