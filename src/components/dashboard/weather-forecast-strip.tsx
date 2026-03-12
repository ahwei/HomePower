"use client";

import { Sun, Cloud, CloudRain, CloudSnow, CloudDrizzle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetWeatherQuery } from "@/store/api/weather-api";
import { useAppSelector } from "@/hooks/use-store";
import type { WeatherForecast } from "@/lib/types";

const DAY_NAMES = ["日", "一", "二", "三", "四", "五", "六"];

function getWeatherIcon(desc: string) {
  if (desc.includes("雨")) return CloudRain;
  if (desc.includes("雪")) return CloudSnow;
  if (desc.includes("陰") || desc.includes("雲")) return Cloud;
  if (desc.includes("毛毛雨")) return CloudDrizzle;
  return Sun;
}

function ForecastCard({ forecast }: { forecast: WeatherForecast }) {
  const date = new Date(forecast.date);
  const dayName = DAY_NAMES[date.getDay()];
  const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
  const Icon = getWeatherIcon(forecast.description);
  const isHot = forecast.highTemp > 33;

  return (
    <Card
      className={`shrink-0 ${isHot ? "border-amber-400" : ""}`}
    >
      <CardContent className="flex w-28 flex-col items-center gap-1 p-3 text-center">
        <p className="text-xs font-medium text-muted-foreground">
          週{dayName} {dateStr}
        </p>
        <Icon className="h-6 w-6 text-muted-foreground" />
        <p className="text-xs">{forecast.description}</p>
        <p className="text-sm font-medium">
          {forecast.highTemp}/{forecast.lowTemp}°C
        </p>
        <p className="text-xs text-muted-foreground">
          冷氣 {forecast.estimatedAcHours}hr
        </p>
      </CardContent>
    </Card>
  );
}

export function WeatherForecastStrip() {
  const location = useAppSelector((s) => s.settings.location);
  const { data = [], isLoading, isError } = useGetWeatherQuery(location, {
    pollingInterval: 3_600_000, // 1 小時
  });

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2">
        {Array.from({ length: 7 }, (_, i) => (
          <Skeleton key={i} className="h-32 w-28 shrink-0 rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError && data.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-center text-muted-foreground">
        天氣資料暫時無法載入
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {data.map((f) => (
        <ForecastCard key={f.date} forecast={f} />
      ))}
    </div>
  );
}
