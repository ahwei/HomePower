"use client";

import { useDevices } from "@/hooks/use-devices";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EnergyOverviewCards } from "./energy-overview-cards";
import { DeviceConsumptionChart } from "./device-consumption-chart";
import { DailyUsageChart } from "./daily-usage-chart";

function DashboardSkeleton() {
  return (
    <>
      {/* EnergyOverviewCards skeleton */}
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
      {/* Charts skeleton */}
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

export function DashboardContent() {
  const { loading, error } = useDevices();

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
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
