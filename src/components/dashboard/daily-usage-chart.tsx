"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetDevicesQuery } from "@/store/api/devices-api";
import { useAppSelector } from "@/hooks/use-store";

interface HourlyData {
  hour: number;
  label: string;
  kwh: number;
}

function useEstimatedHourlyData(): HourlyData[] {
  const { data: devices = [] } = useGetDevicesQuery();

  return useMemo(() => {
    const hourly = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      label: `${h}:00`,
      kwh: 0,
    }));

    const active = devices.filter((d) => d.isActive);
    for (const d of active) {
      const kwhPerHour = d.ratedPowerW / 1000;
      const startHour = 8;
      const hours = Math.min(Math.round(d.dailyHours), 24);
      for (let i = 0; i < hours; i++) {
        const h = (startHour + i) % 24;
        hourly[h].kwh += kwhPerHour;
      }
    }

    for (const h of hourly) {
      h.kwh = Math.round(h.kwh * 100) / 100;
    }

    return hourly;
  }, [devices]);
}

export function DailyUsageChart() {
  const { isLoading } = useGetDevicesQuery();
  const data = useEstimatedHourlyData();
  const planType = useAppSelector((s) => s.settings.planType);
  const showPeakZones = planType !== "residential";
  const hasData = data.some((d) => d.kwh > 0);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">每日用電趨勢</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">每日用電趨勢</CardTitle>
        </CardHeader>
        <CardContent className="flex h-48 items-center justify-center text-muted-foreground">
          尚無用電紀錄
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">每日用電趨勢</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                interval={3}
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
                unit=" kWh"
              />
              <Tooltip
                formatter={(value) => [`${value} kWh`, "用電量"]}
                labelFormatter={(label) => `時間：${label}`}
              />
              {showPeakZones && (
                <>
                  <ReferenceArea
                    x1="8:00"
                    x2="22:00"
                    fill="rgba(239,68,68,0.05)"
                    label={{ value: "尖峰", fontSize: 10 }}
                  />
                </>
              )}
              <Area
                type="monotone"
                dataKey="kwh"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.15}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
