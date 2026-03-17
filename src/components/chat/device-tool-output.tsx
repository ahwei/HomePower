"use client";

import Image from "next/image";

interface DeviceOutput {
  name: string;
  category: string;
  ratedPowerW: number;
  dailyHours: number;
  isActive: boolean;
  imageUrl?: string | null;
  monthlyKwh: number;
}

export function DeviceToolOutput({ devices }: { devices: DeviceOutput[] }) {
  if (!Array.isArray(devices)) return null;
  return (
    <div className="grid gap-2 py-2">
      {devices.map((d) => (
        <div key={d.name} className="flex items-center gap-3 rounded-lg border p-2">
          {d.imageUrl ? (
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md">
              <Image
                src={d.imageUrl}
                alt={d.name}
                fill
                className="object-cover"
                sizes="40px"
              />
            </div>
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
              {d.category.slice(0, 2)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium">{d.name}</span>
              {!d.isActive && (
                <span className="text-xs text-muted-foreground">(已停用)</span>
              )}
            </div>
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span>{d.ratedPowerW}W</span>
              <span>{d.dailyHours}h/天</span>
              <span className="font-medium text-foreground">{d.monthlyKwh} kWh/月</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
