import { createClient } from "@/lib/supabase/server";
import { queryDevices } from "@/lib/queries/devices";
import {
  queryWeeklyUsageTrend,
  queryMonthlyUsageTrend,
  queryCategoryUsage,
} from "@/lib/queries/usage-logs";
import { EnergyOverviewCards } from "./energy-overview-cards";
import { WeeklyUsageChart } from "./weekly-usage-chart";
import { MonthlyUsageChart } from "./monthly-usage-chart";
import { DeviceConsumptionChart } from "./device-consumption-chart";
import { TopDevicesChart } from "./top-devices-chart";
import { DailyUsageChart } from "./daily-usage-chart";

async function getAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, userId: user!.id };
}

/** 能源概覽卡片（需要 devices 資料） */
export async function EnergyOverviewSection() {
  const { supabase, userId } = await getAuth();
  const devices = await queryDevices(supabase, userId);
  return <EnergyOverviewCards devices={devices} />;
}

/** 近 7 天用電量 */
export async function WeeklyChartSection() {
  const { supabase, userId } = await getAuth();
  const data = await queryWeeklyUsageTrend(supabase, userId);
  return <WeeklyUsageChart data={data} />;
}

/** 月度用電趨勢 */
export async function MonthlyChartSection() {
  const { supabase, userId } = await getAuth();
  const data = await queryMonthlyUsageTrend(supabase, userId);
  return <MonthlyUsageChart data={data} />;
}

/** 設備用電佔比（需要 devices 資料） */
export async function DeviceConsumptionSection() {
  const { supabase, userId } = await getAuth();
  const devices = await queryDevices(supabase, userId);
  return <DeviceConsumptionChart devices={devices} />;
}

/** 本月用電 TOP 設備 */
export async function TopDevicesSection() {
  const { supabase, userId } = await getAuth();
  const data = await queryCategoryUsage(supabase, userId);
  return <TopDevicesChart data={data} />;
}

/** 每日用電趨勢（需要 devices 資料） */
export async function DailyChartSection() {
  const { supabase, userId } = await getAuth();
  const devices = await queryDevices(supabase, userId);
  return <DailyUsageChart devices={devices} />;
}
