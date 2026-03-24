import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type Supabase = SupabaseClient<Database>;

/** 取得使用者設定 */
export async function queryGetUserSettings(
  supabase: Supabase,
  userId: string
) {
  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows

  if (!data) {
    return {
      userId,
      planType: "residential" as const,
      location: "高雄",
      householdSize: 3,
    };
  }

  return {
    userId: data.user_id,
    planType: data.plan_type,
    location: data.location,
    householdSize: data.household_size,
  };
}
