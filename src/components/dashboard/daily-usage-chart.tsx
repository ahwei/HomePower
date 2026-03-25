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
import type { Device } from "@/lib/types";

interface HourlyData {
  hour: number;
  label: string;
  kwh: number;
}

function computeHourlyData(devices: Device[]): HourlyData[] {
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
}

interface Props {
  devices?: Device[];
}

export function DailyUsageChart({ devices: serverDevices }: Props) {
  const { data: clientDevices, isLoading } = useGetDevicesQuery(undefined, {
    skip: !!serverDevices,
  });
  const devices = useMemo(
    () => serverDevices ?? clientDevices ?? [],
    [serverDevices, clientDevices]
  );
  const data = useMemo(() => computeHourlyData(devices), [devices]);
  const planType = useAppSelector((s) => s.settings.planType);
  const showPeakZones = planType !== "residential";
  const hasData = data.some((d) => d.kwh > 0);

  if (!serverDevices && isLoading) {
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
                tick={{ fontSize: 11, fill: "#a1a1aa" }}
                interval={3}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#a1a1aa" }}
                unit=" kWh"
              />
              <Tooltip
                formatter={(value) => [`${value} kWh`, "用電量"]}
                labelFormatter={(label) => `時間：${label}`}
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  borderColor: "var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--color-foreground)",
                }}
                itemStyle={{ color: "var(--color-foreground)" }}
                labelStyle={{ color: "var(--color-muted-foreground)" }}
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
                stroke="#34d399"
                fill="#34d399"
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
