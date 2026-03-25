import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import {
  CATEGORY_LABELS,
  CO2_FACTOR_KG_PER_KWH,
} from "@/constants/device-presets";
import type { DeviceCategory } from "@/lib/types";

type Supabase = SupabaseClient<Database>;
type DeviceRow = Database["public"]["Tables"]["devices"]["Row"];

/** snake_case → camelCase 映射 */
function toDevice(r: DeviceRow) {
  return {
    id: r.id,
    userId: r.user_id,
    name: r.name,
    category: r.category as DeviceCategory,
    ratedPowerW: r.rated_power_w,
    dailyHours: Number(r.daily_hours),
    imageUrl: r.image_url,
    isActive: r.is_active,
    schedule: (r.schedule as { start: string; end: string } | null) ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

/** 取得所有設備（server action 用，回傳完整 camelCase 物件） */
export async function queryDevices(supabase: Supabase, userId: string) {
  const { data, error } = await supabase
    .from("devices")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(toDevice);
}

/** 取得設備列表（tool 用，含 monthlyKwh 和 category label） */
export async function queryDevicesForTool(supabase: Supabase, userId: string) {
  const { data, error } = await supabase
    .from("devices")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((d) => ({
    name: d.name,
    category: CATEGORY_LABELS[d.category] ?? d.category,
    ratedPowerW: d.rated_power_w,
    dailyHours: Number(d.daily_hours),
    isActive: d.is_active,
    imageUrl: d.image_url,
    monthlyKwh: Math.round(
      (d.rated_power_w * Number(d.daily_hours) * 30) / 1000
    ),
  }));
}

/** 設備統計摘要（tool 用） */
export async function queryDeviceSummary(supabase: Supabase, userId: string) {
  const { data, error } = await supabase
    .from("devices")
    .select("*")
    .eq("user_id", userId);

  if (error) throw error;
  const rows = data ?? [];
  const total = rows.length;
  const activeDevices = rows.filter((d) => d.is_active);
  const active = activeDevices.length;

  const totalMonthlyKwh = activeDevices.reduce(
    (sum, d) =>
      sum + (d.rated_power_w * Number(d.daily_hours) * 30) / 1000,
    0
  );

  const byCategory: Record<string, number> = {};
  for (const d of activeDevices) {
    const label = CATEGORY_LABELS[d.category] ?? d.category;
    const kwh = (d.rated_power_w * Number(d.daily_hours) * 30) / 1000;
    byCategory[label] = (byCategory[label] ?? 0) + kwh;
  }

  return {
    totalDevices: total,
    activeDevices: active,
    totalMonthlyKwh: Math.round(totalMonthlyKwh),
    co2Kg: Math.round(totalMonthlyKwh * CO2_FACTOR_KG_PER_KWH),
    categoryBreakdown: Object.entries(byCategory)
      .map(([cat, kwh]) => ({
        category: cat,
        kwh: Math.round(kwh),
        percent: Math.round((kwh / totalMonthlyKwh) * 100),
      }))
      .sort((a, b) => b.kwh - a.kwh),
  };
}

/** 節電建議（tool 用） */
export async function queryEnergySavingTips(
  supabase: Supabase,
  userId: string
) {
  const { data, error } = await supabase
    .from("devices")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (error) throw error;
  const rows = data ?? [];

  const tips: string[] = [];
  const highPower = rows
    .filter((d) => d.rated_power_w >= 1000)
    .sort((a, b) => b.rated_power_w - a.rated_power_w);

  for (const d of highPower) {
    const hours = Number(d.daily_hours);
    const monthlyKwh = (d.rated_power_w * hours * 30) / 1000;
    if (d.category === "aircon" && hours > 6) {
      tips.push(
        `${d.name}每日使用 ${d.daily_hours} 小時，月耗 ${Math.round(monthlyKwh)} kWh。建議搭配電扇，溫度設定 26-28°C，可節省 15-20% 用電`
      );
    } else if (d.category === "water_heater" && d.rated_power_w >= 3000) {
      tips.push(
        `${d.name}（${d.rated_power_w}W）耗電較高，月耗 ${Math.round(monthlyKwh)} kWh。建議考慮更換熱泵熱水器，可省 60-70% 電費`
      );
    } else {
      tips.push(
        `${d.name}（${d.rated_power_w}W）月耗 ${Math.round(monthlyKwh)} kWh，建議減少使用時數或選用節能機型`
      );
    }
  }

  if (tips.length === 0) {
    tips.push("您的設備用電都在合理範圍內，繼續保持！");
  }

  return { tips };
}

/** 取得設備（用於 filter dropdown） */
export async function queryDevicesForFilter(
  supabase: Supabase,
  userId: string
) {
  const { data, error } = await supabase
    .from("devices")
    .select("id, name")
    .eq("user_id", userId)
    .order("name");

  if (error) throw error;
  return data ?? [];
}

export { toDevice };
