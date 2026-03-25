"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetMonthlyTrendQuery } from "@/store/api/usage-logs-api";

function formatMonthLabel(ym: string): string {
  // "2026-03" → "3月"
  const month = parseInt(ym.split("-")[1], 10);
  return `${month}月`;
}

function isSummer(ym: string): boolean {
  const month = parseInt(ym.split("-")[1], 10);
  return month >= 6 && month <= 9;
}

interface Props {
  data?: { month: string; kwh: number }[];
}

export function MonthlyUsageChart({ data: serverData }: Props) {
  const { data: clientData, isLoading } = useGetMonthlyTrendQuery(undefined, {
    skip: !!serverData,
  });
  const raw = serverData ?? clientData ?? [];

  const data = raw.map((r) => ({
    ...r,
    label: formatMonthLabel(r.month),
    kwh: Math.round(r.kwh),
    summer: isSummer(r.month),
  }));

  if (!serverData && isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">月度用電趨勢</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-56 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">月度用電趨勢</CardTitle>
        </CardHeader>
        <CardContent className="flex h-56 items-center justify-center text-muted-foreground">
          尚無用電紀錄
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">月度用電趨勢</CardTitle>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#f97316]" />
              夏月
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#38bdf8]" />
              非夏月
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#a1a1aa" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#a1a1aa" }}
                unit=" kWh"
              />
              <Tooltip
                formatter={(value) => [`${value} kWh`, "用電量"]}
                labelFormatter={(_, payload) => {
                  const item = payload?.[0]?.payload;
                  return item ? `${item.month}（${item.summer ? "夏月" : "非夏月"}）` : "";
                }}
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  borderColor: "var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--color-foreground)",
                }}
                itemStyle={{ color: "#38bdf8" }}
                labelStyle={{ color: "var(--color-muted-foreground)" }}
              />
              <Bar
                dataKey="kwh"
                radius={[4, 4, 0, 0]}
                shape={
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  ((props: any) => {
                    const { x, y, width, height, payload } = props;
                    return (
                      <rect
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        rx={4}
                        fill={payload.summer ? "#f97316" : "#38bdf8"}
                      />
                    );
                  }) as never
                }
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
