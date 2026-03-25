import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { queryDevices } from "./devices";
import { queryWeeklyUsageTrend, queryMonthlyUsageTrend, queryCategoryUsage } from "./usage-logs";

type Supabase = SupabaseClient<Database>;

/** 平行取得 Dashboard 所需的所有資料 */
export async function fetchDashboardData(supabase: Supabase, userId: string) {
  const [devices, weeklyTrend, monthlyTrend, categoryUsage] = await Promise.all([
    queryDevices(supabase, userId),
    queryWeeklyUsageTrend(supabase, userId),
    queryMonthlyUsageTrend(supabase, userId),
    queryCategoryUsage(supabase, userId),
  ]);

  return { devices, weeklyTrend, monthlyTrend, categoryUsage };
}
