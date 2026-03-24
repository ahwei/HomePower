import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type Supabase = SupabaseClient<Database>;

export interface UsageLogFilters {
  startDate?: string;
  endDate?: string;
  deviceId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "date" | "kwh";
  sortOrder?: "asc" | "desc";
}

export interface UsageLogRow {
  id: string;
  deviceId: string | null;
  deviceName: string | null;
  date: string;
  hour: number;
  kwh: number;
}

export interface UsageLogsSummary {
  totalKwh: number;
  avgDailyKwh: number;
  days: number;
}

export interface UsageLogsResult {
  rows: UsageLogRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: UsageLogsSummary;
}

/** 分頁取得用電紀錄 */
export async function queryUsageLogs(
  supabase: Supabase,
  userId: string,
  filters: UsageLogFilters = {}
): Promise<UsageLogsResult> {
  const {
    startDate,
    endDate,
    deviceId,
    page = 1,
    pageSize = 20,
    sortBy = "date",
    sortOrder = "desc",
  } = filters;

  const { data, error } = await supabase.rpc("get_usage_logs", {
    p_user_id: userId,
    p_start_date: startDate ?? null,
    p_end_date: endDate ?? null,
    p_device_id: deviceId ?? null,
    p_page: page,
    p_page_size: pageSize,
    p_sort_by: sortBy,
    p_sort_order: sortOrder,
  });

  if (error) throw error;

  const result = data as unknown as {
    rows: Array<{
      id: string;
      device_id: string | null;
      device_name: string | null;
      date: string;
      hour: number;
      kwh: number;
    }>;
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    summary: UsageLogsSummary;
  };

  return {
    rows: (result.rows ?? []).map((r) => ({
      id: r.id,
      deviceId: r.device_id,
      deviceName: r.device_name,
      date: r.date,
      hour: r.hour,
      kwh: Number(r.kwh),
    })),
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    totalPages: result.totalPages,
    summary: result.summary,
  };
}

/** 最近 7 天每日用電量 */
export async function queryWeeklyUsageTrend(
  supabase: Supabase,
  userId: string
) {
  const { data, error } = await supabase.rpc("get_weekly_usage_trend", {
    p_user_id: userId,
  });

  if (error) throw error;
  return (data as unknown as Array<{ date: string; kwh: number }>) ?? [];
}

/** 最近 12 個月每月用電量 */
export async function queryMonthlyUsageTrend(
  supabase: Supabase,
  userId: string
) {
  const { data, error } = await supabase.rpc("get_monthly_usage_trend", {
    p_user_id: userId,
  });

  if (error) throw error;
  return (data as unknown as Array<{ month: string; kwh: number }>) ?? [];
}

/** 本月各類別用電量 */
export async function queryCategoryUsage(
  supabase: Supabase,
  userId: string
) {
  const { data, error } = await supabase.rpc("get_category_usage", {
    p_user_id: userId,
  });

  if (error) throw error;
  return (
    (data as unknown as Array<{
      category: string;
      deviceName: string;
      kwh: number;
    }>) ?? []
  );
}

/** 指定日期區間的每日用電量（tool 用） */
export async function queryUsageByDateRange(
  supabase: Supabase,
  userId: string,
  startDate: string,
  endDate: string
) {
  const { data, error } = await supabase.rpc("get_usage_by_date_range", {
    p_user_id: userId,
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error) throw error;
  return (data as unknown as Array<{ date: string; kwh: number }>) ?? [];
}

/** 指定年月的月度用電摘要（tool 用） */
export async function queryMonthlyUsageSummary(
  supabase: Supabase,
  userId: string,
  year: number,
  month: number
) {
  const { data, error } = await supabase.rpc("get_monthly_usage_summary", {
    p_user_id: userId,
    p_year: year,
    p_month: month,
  });

  if (error) throw error;
  return data as unknown as {
    year: number;
    month: number;
    totalKwh: number;
    dailyAvgKwh: number;
    co2Kg: number;
    deviceRanking: Array<{ device: string; kwh: number }>;
  };
}
