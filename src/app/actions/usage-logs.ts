"use server";

import { eq, and, desc, gte, lte, sql, asc } from "drizzle-orm";
import { authDb } from "@/db";
import { usageLogs, devices } from "@/db/schema";
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

export interface UsageLogFilters {
  startDate?: string; // YYYY-MM-DD
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

export interface UsageLogsResult {
  rows: UsageLogRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function getUsageLogs(
  filters: UsageLogFilters = {}
): Promise<UsageLogsResult> {
  const userId = await getUserId();
  const {
    startDate,
    endDate,
    deviceId,
    page = 1,
    pageSize = 20,
    sortBy = "date",
    sortOrder = "desc",
  } = filters;

  return authDb(userId, async (tx) => {
    // Build WHERE conditions
    const conditions = [eq(usageLogs.userId, userId)];
    if (startDate) conditions.push(gte(usageLogs.date, new Date(startDate)));
    if (endDate) conditions.push(lte(usageLogs.date, new Date(endDate)));
    if (deviceId) conditions.push(eq(usageLogs.deviceId, deviceId));

    const where = and(...conditions);

    // Count total
    const [{ count }] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(usageLogs)
      .where(where);

    // Fetch rows with device name join
    const orderFn = sortOrder === "asc" ? asc : desc;
    const orderCol =
      sortBy === "kwh" ? usageLogs.kwh : usageLogs.date;

    const rows = await tx
      .select({
        id: usageLogs.id,
        deviceId: usageLogs.deviceId,
        deviceName: devices.name,
        date: usageLogs.date,
        hour: usageLogs.hour,
        kwh: usageLogs.kwh,
      })
      .from(usageLogs)
      .leftJoin(devices, eq(usageLogs.deviceId, devices.id))
      .where(where)
      .orderBy(orderFn(orderCol), desc(usageLogs.hour))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return {
      rows: rows.map((r) => ({
        id: r.id,
        deviceId: r.deviceId,
        deviceName: r.deviceName,
        date:
          r.date instanceof Date
            ? r.date.toISOString().slice(0, 10)
            : String(r.date),
        hour: r.hour,
        kwh: Number(r.kwh),
      })),
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  });
}

/** 取得使用者所有設備（用於 filter dropdown） */
export async function getDevicesForFilter() {
  const userId = await getUserId();
  return authDb(userId, (tx) =>
    tx
      .select({ id: devices.id, name: devices.name })
      .from(devices)
      .where(eq(devices.userId, userId))
      .orderBy(asc(devices.name))
  );
}
