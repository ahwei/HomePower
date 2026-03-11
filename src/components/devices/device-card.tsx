"use client";

import {
  AirVent,
  UtensilsCrossed,
  Flame,
  WashingMachine,
  Tv,
  Monitor,
  Lightbulb,
  Car,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { computeMonthlyKwh } from "@/lib/types";
import type { Device, DeviceCategory } from "@/lib/types";
import { CATEGORY_LABELS } from "@/constants/device-presets";

const CATEGORY_ICONS: Record<DeviceCategory, React.ComponentType<{ className?: string }>> = {
  aircon: AirVent,
  kitchen: UtensilsCrossed,
  water_heater: Flame,
  laundry: WashingMachine,
  entertainment: Tv,
  office: Monitor,
  lighting: Lightbulb,
  ev_charging: Car,
};

interface DeviceCardProps {
  device: Device;
  onToggle: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
}

export function DeviceCard({ device, onToggle, onDelete }: DeviceCardProps) {
  const Icon = CATEGORY_ICONS[device.category] ?? Monitor;
  const monthlyKwh = computeMonthlyKwh(device);

  return (
    <Card
      data-testid={`device-card-${device.id}`}
      className={!device.isActive ? "opacity-60" : ""}
    >
      <CardContent className="flex items-start gap-3 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="truncate font-medium">{device.name}</h3>
            <Switch
              data-testid={`device-toggle-${device.id}`}
              checked={device.isActive}
              onCheckedChange={() => onToggle(device.id, device.isActive)}
              role="switch"
              aria-checked={device.isActive}
              aria-label={`切換 ${device.name}`}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {CATEGORY_LABELS[device.category] ?? device.category}
          </p>
          <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
            <span>{device.ratedPowerW}W</span>
            <span>{device.dailyHours}h/天</span>
            <span className="font-medium text-foreground">
              {Math.round(monthlyKwh)} kWh/月
            </span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(device.id)}
          aria-label={`刪除 ${device.name}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
