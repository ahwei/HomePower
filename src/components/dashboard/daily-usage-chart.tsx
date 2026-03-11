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
import { useAppSelector } from "@/hooks/use-store";

interface HourlyData {
  hour: number;
  label: string;
  kwh: number;
}

/**
 * 目前使用靜態估算資料（依設備推估）。
 * 有 usage_logs 後可改為從 DB 查詢。
 */
function useEstimatedHourlyData(): HourlyData[] {
  const devices = useAppSelector((s) => s.devices.items);

  return useMemo(() => {
    const hourly = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      label: `${h}:00`,
      kwh: 0,
    }));

    const active = devices.filter((d) => d.isActive);
    for (const d of active) {
      const kwhPerHour = d.ratedPowerW / 1000;
      // 平均分散到 dailyHours 小時（假設從早上 8 點開始）
      const startHour = 8;
      const hours = Math.min(Math.round(d.dailyHours), 24);
      for (let i = 0; i < hours; i++) {
        const h = (startHour + i) % 24;
        hourly[h].kwh += kwhPerHour;
      }
    }

    // 四捨五入
    for (const h of hourly) {
      h.kwh = Math.round(h.kwh * 100) / 100;
    }

    return hourly;
  }, [devices]);
}

export function DailyUsageChart() {
  const data = useEstimatedHourlyData();
  const planType = useAppSelector((s) => s.settings.planType);
  const showPeakZones = planType !== "residential";
  const hasData = data.some((d) => d.kwh > 0);

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
                  {/* 尖峰時段 07:30-22:30 → 簡化為 8-22 */}
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
