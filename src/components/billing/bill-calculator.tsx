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
import { useGetDevicesQuery } from "@/store/api/devices-api";
import { useAppSelector } from "@/hooks/use-store";
import { computeMonthlyKwh } from "@/lib/types";
import { calculateBill } from "@/components/billing/calculate-bill";

export function BillCalculator() {
  const { data: devices = [] } = useGetDevicesQuery();
  const { planType, isSummer } = useAppSelector((s) => s.settings);

  const result = useMemo(() => {
    const active = devices.filter((d) => d.isActive);
    const totalKwh = active.reduce((s, d) => s + computeMonthlyKwh(d), 0);

    // 時間電價：簡易拆分（尖峰 60% / 離峰 40%）
    const peakKwh = Math.round(totalKwh * 0.6);
    const offPeakKwh = Math.round(totalKwh * 0.4);
    const midPeakKwh = Math.round(totalKwh * 0.3);

    return calculateBill({
      kwh: totalKwh,
      planType,
      isSummer,
      peakKwh,
      offPeakKwh: planType === "time_of_use_3" ? Math.round(totalKwh * 0.3) : offPeakKwh,
      midPeakKwh,
    });
  }, [devices, planType, isSummer]);

  return (
    <Card data-testid="bill-result">
      <CardHeader>
        <CardTitle className="text-sm font-medium">電費計算結果</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">
            ${result.totalAmount.toLocaleString()}
          </span>
          <span className="text-sm text-muted-foreground">TWD / 月</span>
        </div>
        <p className="text-sm text-muted-foreground">
          平均單價 ${result.avgRate} / kWh
          <span className="mx-2">·</span>
          {result.isSummer ? "夏月" : "非夏月"}費率
        </p>

        {/* 級距明細 */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>級距</TableHead>
              <TableHead className="text-right">度數</TableHead>
              <TableHead className="text-right">單價</TableHead>
              <TableHead className="text-right">小計</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.breakdown.map((tier, i) => (
              <TableRow key={i}>
                <TableCell>{tier.tier}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {tier.kwh} kWh
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  ${tier.rate}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  ${tier.amount.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
