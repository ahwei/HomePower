"use client";

import { useState, useMemo, useRef } from "react";
import { useGetUsageLogsQuery } from "@/store/api/usage-logs-api";
import { UsageLogsFilters, type FilterValues } from "./usage-logs-filters";
import { UsageLogsTable } from "./usage-logs-table";
import { UsageLogsPagination } from "./usage-logs-pagination";
import { UsageLogsSummaryCards } from "./usage-logs-summary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { UsageLogsResult } from "@/lib/queries/usage-logs";

function getDefaultFilters(): FilterValues & { page: number; pageSize: number } {
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return {
    startDate: thirtyDaysAgo.toISOString().slice(0, 10),
    endDate: today.toISOString().slice(0, 10),
    deviceId: "all",
    sortBy: "date",
    sortOrder: "desc",
    page: 1,
    pageSize: 20,
  };
}

interface UsageLogsViewProps {
  initialData?: UsageLogsResult;
}

export function UsageLogsView({ initialData }: UsageLogsViewProps) {
  const [filters, setFilters] = useState(getDefaultFilters);
  const hasInteracted = useRef(false);

  const queryParams = useMemo(
    () => ({
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      deviceId: filters.deviceId === "all" ? undefined : filters.deviceId,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      page: filters.page,
      pageSize: filters.pageSize,
    }),
    [filters]
  );

  const useServerData = !!initialData && !hasInteracted.current;

  const { data: clientData, isLoading: clientLoading, error } = useGetUsageLogsQuery(
    queryParams,
    { skip: useServerData }
  );

  const data = useServerData ? initialData : clientData;
  const isLoading = useServerData ? false : clientLoading;

  function handleFilterChange(next: FilterValues) {
    hasInteracted.current = true;
    setFilters((prev) => ({ ...prev, ...next, page: 1 }));
  }

  function handleReset() {
    hasInteracted.current = true;
    setFilters(getDefaultFilters());
  }

  function handlePageChange(page: number) {
    hasInteracted.current = true;
    setFilters((prev) => ({ ...prev, page }));
  }

  function handlePageSizeChange(pageSize: number) {
    hasInteracted.current = true;
    setFilters((prev) => ({ ...prev, pageSize, page: 1 }));
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>篩選條件</CardTitle>
        </CardHeader>
        <CardContent>
          <UsageLogsFilters
            filters={filters}
            onChange={handleFilterChange}
            onReset={handleReset}
          />
        </CardContent>
      </Card>

      <UsageLogsSummaryCards summary={data?.summary} isLoading={isLoading} />

      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error && typeof error === "object" && "error" in error
              ? (error as { error: string }).error
              : "載入用電紀錄失敗"}
          </AlertDescription>
        </Alert>
      ) : null}

      <UsageLogsTable rows={data?.rows ?? []} isLoading={isLoading} />

      {data && data.total > 0 && (
        <UsageLogsPagination
          page={data.page}
          totalPages={data.totalPages}
          total={data.total}
          pageSize={data.pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}
    </div>
  );
}
