"use client";

import { useMemo } from "react";
import { Zap, Receipt, Leaf } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetDevicesQuery } from "@/store/api/devices-api";
import { useAppSelector } from "@/hooks/use-store";
import { computeMonthlyKwh } from "@/lib/types";
import { calculateResidentialBill } from "@/components/billing/calculate-bill";
import { isSummerMonth } from "@/constants/electricity-plans";
import { CO2_FACTOR_KG_PER_KWH } from "@/constants/device-presets";

function CardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-24" />
        <Skeleton className="mt-1 h-3 w-10" />
      </CardContent>
    </Card>
  );
}

export function EnergyOverviewCards() {
  const { data: devices = [], isLoading } = useGetDevicesQuery();
  const settings = useAppSelector((s) => s.settings);

  const stats = useMemo(() => {
    const activeDevices = devices.filter((d) => d.isActive);
    const totalKwh = activeDevices.reduce(
      (sum, d) => sum + computeMonthlyKwh(d),
      0
    );
    const summer = isSummerMonth();
    const bill = calculateResidentialBill(totalKwh, summer);
    const co2 = totalKwh * CO2_FACTOR_KG_PER_KWH;

    return {
      totalKwh: Math.round(totalKwh),
      billAmount: Math.round(bill.totalAmount),
      co2Kg: Number(co2.toFixed(1)),
      planName: settings.planType,
    };
  }, [devices, settings.planType]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card data-testid="energy-card-kwh">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">本月用電</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalKwh.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">kWh</p>
        </CardContent>
      </Card>

      <Card data-testid="energy-card-bill">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">預估電費</CardTitle>
          <Receipt className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${stats.billAmount.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">TWD</p>
        </CardContent>
      </Card>

      <Card data-testid="energy-card-co2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">碳排放</CardTitle>
          <Leaf className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.co2Kg.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">kg CO₂</p>
        </CardContent>
      </Card>
    </div>
  );
}
