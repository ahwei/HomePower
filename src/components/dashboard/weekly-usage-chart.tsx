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
import { useGetWeeklyTrendQuery } from "@/store/api/usage-logs-api";

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const weekday = WEEKDAYS[d.getDay()];
  return `${d.getMonth() + 1}/${d.getDate()} (${weekday})`;
}

export function WeeklyUsageChart() {
  const { data: raw = [], isLoading } = useGetWeeklyTrendQuery();

  const data = raw.map((r) => ({
    ...r,
    label: formatDateLabel(r.date),
    kwh: Math.round(r.kwh * 10) / 10,
  }));

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">近 7 天用電量</CardTitle>
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
          <CardTitle className="text-sm font-medium">近 7 天用電量</CardTitle>
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
        <CardTitle className="text-sm font-medium">近 7 天用電量</CardTitle>
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
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  borderColor: "var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--color-foreground)",
                }}
                itemStyle={{ color: "#60a5fa" }}
                labelStyle={{ color: "var(--color-muted-foreground)" }}
              />
              <Bar
                dataKey="kwh"
                fill="#60a5fa"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
