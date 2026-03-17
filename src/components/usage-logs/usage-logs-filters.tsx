"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { useGetDevicesForFilterQuery } from "@/store/api/usage-logs-api";

export interface FilterValues {
  startDate: string;
  endDate: string;
  deviceId: string;
  sortBy: "date" | "kwh";
  sortOrder: "asc" | "desc";
}

interface UsageLogsFiltersProps {
  filters: FilterValues;
  onChange: (filters: FilterValues) => void;
  onReset: () => void;
}

export function UsageLogsFilters({
  filters,
  onChange,
  onReset,
}: UsageLogsFiltersProps) {
  const { data: deviceOptions = [] } = useGetDevicesForFilterQuery();

  function update(partial: Partial<FilterValues>) {
    onChange({ ...filters, ...partial });
  }

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="startDate">起始日期</Label>
        <Input
          id="startDate"
          type="date"
          value={filters.startDate}
          onChange={(e) => update({ startDate: e.target.value })}
          className="w-40"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="endDate">結束日期</Label>
        <Input
          id="endDate"
          type="date"
          value={filters.endDate}
          onChange={(e) => update({ endDate: e.target.value })}
          className="w-40"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>設備</Label>
        <Select
          value={filters.deviceId}
          onValueChange={(v) => update({ deviceId: v ?? "all" })}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="全部設備" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部設備</SelectItem>
            {deviceOptions.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>排序</Label>
        <Select
          value={filters.sortBy}
          onValueChange={(v) => v && update({ sortBy: v as FilterValues["sortBy"] })}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">日期</SelectItem>
            <SelectItem value="kwh">用電量</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>順序</Label>
        <Select
          value={filters.sortOrder}
          onValueChange={(v) =>
            v && update({ sortOrder: v as FilterValues["sortOrder"] })
          }
        >
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">新→舊</SelectItem>
            <SelectItem value="asc">舊→新</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button variant="outline" size="icon" onClick={onReset} title="重置篩選">
        <RotateCcw className="h-4 w-4" />
      </Button>
    </div>
  );
}
