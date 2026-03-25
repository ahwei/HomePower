"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetCategoryUsageQuery } from "@/store/api/usage-logs-api";

const COLORS = [
  "#f97316", "#60a5fa", "#34d399", "#a78bfa",
  "#fb7185", "#fbbf24", "#2dd4bf", "#818cf8",
];

interface Props {
  data?: { category: string; deviceName: string; kwh: number }[];
}

export function TopDevicesChart({ data: serverData }: Props) {
  const { data: clientData, isLoading } = useGetCategoryUsageQuery(undefined, {
    skip: !!serverData,
  });
  const raw = serverData ?? clientData ?? [];

  const data = raw.slice(0, 8).map((r, i) => ({
    name: r.deviceName,
    kwh: Math.round(r.kwh * 10) / 10,
    fill: COLORS[i % COLORS.length],
  }));

  if (!serverData && isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">本月用電 TOP 設備</CardTitle>
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
          <CardTitle className="text-sm font-medium">本月用電 TOP 設備</CardTitle>
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
        <CardTitle className="text-sm font-medium">本月用電 TOP 設備</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical">
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: "#a1a1aa" }}
                unit=" kWh"
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: "#a1a1aa" }}
                width={80}
              />
              <Tooltip
                formatter={(value) => [`${value} kWh`, "用電量"]}
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  borderColor: "var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--color-foreground)",
                }}
                itemStyle={{ color: "#f97316" }}
                labelStyle={{ color: "var(--color-muted-foreground)" }}
              />
              <Bar
                dataKey="kwh"
                radius={[0, 4, 4, 0]}
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
                        fill={payload.fill}
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
