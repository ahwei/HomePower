"use client";

import { useEffect, useRef } from "react";
import { useGetDevicesQuery, devicesApi } from "@/store/api/devices-api";
import { useAppDispatch } from "@/hooks/use-store";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EnergyOverviewCards } from "./energy-overview-cards";
import { DeviceConsumptionChart } from "./device-consumption-chart";
import { DailyUsageChart } from "./daily-usage-chart";
import type { Device } from "@/lib/types";

function DashboardSkeleton() {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24" />
              <Skeleton className="mt-1 h-3 w-10" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-28" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

interface DashboardContentProps {
  initialDevices: Device[];
}

export function DashboardContent({ initialDevices }: DashboardContentProps) {
  const dispatch = useAppDispatch();
  const hydrated = useRef(false);

  // 將 Server Component 拿到的資料注入 RTK Query cache
  useEffect(() => {
    if (!hydrated.current && initialDevices.length > 0) {
      dispatch(
        devicesApi.util.upsertQueryData("getDevices", undefined, initialDevices)
      );
      hydrated.current = true;
    }
  }, [dispatch, initialDevices]);

  const { isLoading, isError } = useGetDevicesQuery();

  // 有 SSR 初始資料時不需要顯示 skeleton
  if (isLoading && initialDevices.length === 0) {
    return <DashboardSkeleton />;
  }

  if (isError && initialDevices.length === 0) {
    return (
      <>
        <div className="rounded-lg border border-dashed p-4 text-center text-muted-foreground">
          設備資料載入失敗，重試中...
        </div>
        <DashboardSkeleton />
      </>
    );
  }

  return (
    <>
      <EnergyOverviewCards />
      <div className="grid gap-4 lg:grid-cols-2">
        <DeviceConsumptionChart />
        <DailyUsageChart />
      </div>
    </>
  );
}
