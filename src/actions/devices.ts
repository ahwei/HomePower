"use server";

import { createClient } from "@/lib/supabase/server";
import { queryDevices } from "@/lib/queries/devices";

async function getUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("未登入");
  return { userId: user.id, supabase };
}

export async function getDevices() {
  const { userId, supabase } = await getUserId();
  return queryDevices(supabase, userId);
}

export async function createDevice(data: {
  name: string;
  category: string;
  ratedPowerW: number;
  dailyHours: number;
}) {
  const { userId, supabase } = await getUserId();
  const { data: row, error } = await supabase
    .from("devices")
    .insert({
      user_id: userId,
      name: data.name,
      category: data.category,
      rated_power_w: data.ratedPowerW,
      daily_hours: String(data.dailyHours),
    })
    .select()
    .single();

  if (error) throw error;
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    category: row.category,
    ratedPowerW: row.rated_power_w,
    dailyHours: Number(row.daily_hours),
    imageUrl: row.image_url,
    isActive: row.is_active,
    schedule: row.schedule as { start: string; end: string } | null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function toggleDevice(id: string, currentIsActive: boolean) {
  const { userId, supabase } = await getUserId();
  const { data: row, error } = await supabase
    .from("devices")
    .update({ is_active: !currentIsActive })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return row;
}

export async function deleteDevice(id: string) {
  const { userId, supabase } = await getUserId();

  // Clean up storage image
  await supabase.storage
    .from("device-images")
    .remove([`${userId}/${id}.webp`]);

  const { error } = await supabase
    .from("devices")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function updateDevice(
  id: string,
  data: Partial<{
    name: string;
    category: string;
    ratedPowerW: number;
    dailyHours: number;
    imageUrl: string | null;
    schedule: { start: string; end: string } | null;
  }>
) {
  const { userId, supabase } = await getUserId();
  const { schedule, dailyHours, imageUrl, ratedPowerW, ...rest } = data;

  const updateData: Record<string, unknown> = {};
  if (rest.name !== undefined) updateData.name = rest.name;
  if (rest.category !== undefined) updateData.category = rest.category;
  if (ratedPowerW !== undefined) updateData.rated_power_w = ratedPowerW;
  if (dailyHours !== undefined) updateData.daily_hours = String(dailyHours);
  if (imageUrl !== undefined) updateData.image_url = imageUrl;
  if (schedule !== undefined) updateData.schedule = schedule;

  const { data: row, error } = await supabase
    .from("devices")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    category: row.category,
    ratedPowerW: row.rated_power_w,
    dailyHours: Number(row.daily_hours),
    imageUrl: row.image_url,
    isActive: row.is_active,
    schedule: row.schedule as { start: string; end: string } | null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
