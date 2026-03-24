"use server";

import { createClient } from "@/lib/supabase/server";
import {
  queryUsageLogs,
  queryWeeklyUsageTrend,
  queryMonthlyUsageTrend,
  queryCategoryUsage,
  type UsageLogFilters,
  type UsageLogsResult,
} from "@/queries/usage-logs";
import { queryDevicesForFilter } from "@/queries/devices";

async function getUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("未登入");
  return { userId: user.id, supabase };
}

export type { UsageLogFilters, UsageLogsResult };
export type { UsageLogRow, UsageLogsSummary } from "@/queries/usage-logs";

export async function getUsageLogs(
  filters: UsageLogFilters = {}
): Promise<UsageLogsResult> {
  const { userId, supabase } = await getUserId();
  return queryUsageLogs(supabase, userId, filters);
}

export async function getWeeklyUsageTrend() {
  const { userId, supabase } = await getUserId();
  return queryWeeklyUsageTrend(supabase, userId);
}

export async function getMonthlyUsageTrend() {
  const { userId, supabase } = await getUserId();
  return queryMonthlyUsageTrend(supabase, userId);
}

export async function getCategoryUsage() {
  const { userId, supabase } = await getUserId();
  return queryCategoryUsage(supabase, userId);
}

export async function getDevicesForFilter() {
  const { userId, supabase } = await getUserId();
  return queryDevicesForFilter(supabase, userId);
}
