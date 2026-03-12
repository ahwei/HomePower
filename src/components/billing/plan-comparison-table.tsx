"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useGetDevicesQuery } from "@/store/api/devices-api";
import { useAppSelector } from "@/hooks/use-store";
import { computeMonthlyKwh } from "@/lib/types";
import type { PlanType, BillResult } from "@/lib/types";
import { calculateBill } from "@/components/billing/calculate-bill";
import { ELECTRICITY_PLANS } from "@/constants/electricity-plans";

interface PlanComparison {
  planId: string;
  planName: string;
  result: BillResult;
}

export function PlanComparisonTable() {
  const { data: devices = [] } = useGetDevicesQuery();
  const { isSummer } = useAppSelector((s) => s.settings);

  const comparisons = useMemo(() => {
    const active = devices.filter((d) => d.isActive);
    const totalKwh = active.reduce((s, d) => s + computeMonthlyKwh(d), 0);
    const peakKwh = Math.round(totalKwh * 0.6);
    const offPeakKwh = Math.round(totalKwh * 0.4);
    const midPeakKwh = Math.round(totalKwh * 0.3);

    const results: PlanComparison[] = ELECTRICITY_PLANS.map((plan) => ({
      planId: plan.id,
      planName: plan.name,
      result: calculateBill({
        kwh: totalKwh,
        planType: plan.type as PlanType,
        isSummer,
        peakKwh,
        offPeakKwh:
          plan.type === "time_of_use_3"
            ? Math.round(totalKwh * 0.3)
            : offPeakKwh,
        midPeakKwh,
      }),
    }));

    return results;
  }, [devices, isSummer]);

  const cheapest = comparisons.reduce((min, c) =>
    c.result.totalAmount < min.result.totalAmount ? c : min
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">方案比較</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>電價方案</TableHead>
              <TableHead className="text-right">電費</TableHead>
              <TableHead className="text-right">平均單價</TableHead>
              <TableHead className="text-right">差額</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {comparisons.map((c) => {
              const isBest = c.planId === cheapest.planId;
              const diff = c.result.totalAmount - cheapest.result.totalAmount;
              return (
                <TableRow
                  key={c.planId}
                  className={isBest ? "bg-green-50 dark:bg-green-950/20" : ""}
                >
                  <TableCell className="flex items-center gap-2">
                    {c.planName}
                    {isBest && (
                      <Badge variant="secondary" className="text-xs">
                        最划算
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    ${c.result.totalAmount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    ${c.result.avgRate}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {diff === 0 ? "-" : `+$${Math.round(diff).toLocaleString()}`}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
