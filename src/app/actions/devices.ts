"use server";

import { eq, and, desc } from "drizzle-orm";
import { authDb } from "@/db";
import { devices } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

/** 取得當前登入 user ID */
async function getUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("未登入");
  return user.id;
}

export async function getDevices() {
  const userId = await getUserId();
  return authDb(userId, (tx) =>
    tx
      .select()
      .from(devices)
      .where(eq(devices.userId, userId))
      .orderBy(desc(devices.createdAt))
  );
}

export async function createDevice(data: {
  name: string;
  category: string;
  ratedPowerW: number;
  dailyHours: number;
}) {
  const userId = await getUserId();
  return authDb(userId, async (tx) => {
    const [row] = await tx
      .insert(devices)
      .values({
        userId,
        name: data.name,
        category: data.category,
        ratedPowerW: data.ratedPowerW,
        dailyHours: String(data.dailyHours),
      })
      .returning();
    return row;
  });
}

export async function toggleDevice(id: string, currentIsActive: boolean) {
  const userId = await getUserId();
  return authDb(userId, async (tx) => {
    const [row] = await tx
      .update(devices)
      .set({ isActive: !currentIsActive })
      .where(and(eq(devices.id, id), eq(devices.userId, userId)))
      .returning();
    return row;
  });
}

export async function deleteDevice(id: string) {
  const userId = await getUserId();
  return authDb(userId, (tx) =>
    tx
      .delete(devices)
      .where(and(eq(devices.id, id), eq(devices.userId, userId)))
  );
}

export async function updateDevice(
  id: string,
  data: Partial<{
    name: string;
    category: string;
    ratedPowerW: number;
    dailyHours: number;
    schedule: { start: string; end: string } | null;
  }>
) {
  const userId = await getUserId();
  const { schedule, dailyHours, ...rest } = data;
  return authDb(userId, async (tx) => {
    const [row] = await tx
      .update(devices)
      .set({
        ...rest,
        ...(dailyHours !== undefined && { dailyHours: String(dailyHours) }),
        ...(schedule !== undefined && { schedule }),
      })
      .where(and(eq(devices.id, id), eq(devices.userId, userId)))
      .returning();
    return row;
  });
}
