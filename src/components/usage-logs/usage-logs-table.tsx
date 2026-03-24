"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { UsageLogRow } from "@/queries/usage-logs";

interface UsageLogsTableProps {
  rows: UsageLogRow[];
  isLoading: boolean;
}

function formatHour(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

export function UsageLogsTable({ rows, isLoading }: UsageLogsTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground">
        沒有符合條件的用電紀錄
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>日期</TableHead>
            <TableHead>時段</TableHead>
            <TableHead>設備</TableHead>
            <TableHead className="text-right">用電量 (kWh)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.date}</TableCell>
              <TableCell>{formatHour(row.hour)}</TableCell>
              <TableCell>
                {row.deviceName ? (
                  <Badge variant="secondary">{row.deviceName}</Badge>
                ) : (
                  <span className="text-muted-foreground">未知設備</span>
                )}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.kwh.toFixed(3)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
