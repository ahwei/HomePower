import { tool } from "ai";
import { z } from "zod/v4";
import { eq, and, sql, desc, gte, lte } from "drizzle-orm";
import { db, authDb } from "@/db";
import { devices, usageLogs, userSettings } from "@/db/schema";
import { calculateBill } from "@/components/billing/calculate-bill";
import { isSummerMonth } from "@/constants/electricity-plans";
import { CATEGORY_LABELS, CO2_FACTOR_KG_PER_KWH } from "@/constants/device-presets";
import type { PlanType } from "@/lib/types";

export function createTools(userId: string) {
  /** Run a query within an RLS-enforced transaction */
  const withRls = <T>(fn: (tx: typeof db) => Promise<T>) =>
    authDb(userId, fn);

  return {
    getDevices: tool({
      description:
        "查詢使用者的所有家電設備，包含名稱、類別、額定功率、每日使用時數、是否啟用",
      inputSchema: z.object({}),
      execute: () =>
        withRls(async (tx) => {
          const rows = await tx
            .select()
            .from(devices)
            .where(eq(devices.userId, userId))
            .orderBy(desc(devices.createdAt));

          return rows.map((d) => ({
            name: d.name,
            category: CATEGORY_LABELS[d.category] ?? d.category,
            ratedPowerW: d.ratedPowerW,
            dailyHours: Number(d.dailyHours),
            isActive: d.isActive,
            monthlyKwh: Math.round(
              (d.ratedPowerW * Number(d.dailyHours) * 30) / 1000
            ),
          }));
        }),
    }),

    getDeviceSummary: tool({
      description:
        "取得設備統計摘要：總數、啟用數、預估月總用電量、各類別用電佔比",
      inputSchema: z.object({}),
      execute: () =>
        withRls(async (tx) => {
          const rows = await tx
            .select()
            .from(devices)
            .where(eq(devices.userId, userId));

          const total = rows.length;
          const active = rows.filter((d) => d.isActive).length;
          const activeDevices = rows.filter((d) => d.isActive);

          const totalMonthlyKwh = activeDevices.reduce(
            (sum, d) =>
              sum + (d.ratedPowerW * Number(d.dailyHours) * 30) / 1000,
            0
          );

          const byCategory: Record<string, number> = {};
          for (const d of activeDevices) {
            const label = CATEGORY_LABELS[d.category] ?? d.category;
            const kwh = (d.ratedPowerW * Number(d.dailyHours) * 30) / 1000;
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
        }),
    }),

    getUsageByDateRange: tool({
      description:
        "查詢指定日期區間的每日用電量（kWh），可用於趨勢分析、月度比較",
      inputSchema: z.object({
        startDate: z.string().describe("起始日期 YYYY-MM-DD"),
        endDate: z.string().describe("結束日期 YYYY-MM-DD"),
      }),
      execute: ({ startDate, endDate }) =>
        withRls(async (tx) => {
          const rows = await tx
            .select({
              date: usageLogs.date,
              totalKwh: sql<string>`sum(${usageLogs.kwh})::numeric(10,2)`,
            })
            .from(usageLogs)
            .where(
              and(
                eq(usageLogs.userId, userId),
                gte(usageLogs.date, new Date(startDate)),
                lte(usageLogs.date, new Date(endDate))
              )
            )
            .groupBy(usageLogs.date)
            .orderBy(usageLogs.date);

          return rows.map((r) => ({
            date:
              r.date instanceof Date
                ? r.date.toISOString().slice(0, 10)
                : String(r.date),
            kwh: Number(r.totalKwh),
          }));
        }),
    }),

    getMonthlyUsageSummary: tool({
      description:
        "查詢指定年月的月度用電摘要：總 kWh、日均 kWh、各設備用電排名",
      inputSchema: z.object({
        year: z.number().describe("年份，例如 2026"),
        month: z.number().min(1).max(12).describe("月份 1-12"),
      }),
      execute: ({ year, month }) =>
        withRls(async (tx) => {
          const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
          const endDate =
            month === 12
              ? `${year + 1}-01-01`
              : `${year}-${String(month + 1).padStart(2, "0")}-01`;

          const rows = await tx
            .select({
              deviceId: usageLogs.deviceId,
              totalKwh: sql<string>`sum(${usageLogs.kwh})::numeric(10,2)`,
            })
            .from(usageLogs)
            .where(
              and(
                eq(usageLogs.userId, userId),
                gte(usageLogs.date, new Date(startDate)),
                lte(usageLogs.date, new Date(endDate))
              )
            )
            .groupBy(usageLogs.deviceId);

          const deviceRows = await tx
            .select({ id: devices.id, name: devices.name })
            .from(devices)
            .where(eq(devices.userId, userId));

          const deviceMap = new Map(deviceRows.map((d) => [d.id, d.name]));

          const deviceUsage = rows
            .map((r) => ({
              device: deviceMap.get(r.deviceId ?? "") ?? "未知設備",
              kwh: Number(r.totalKwh),
            }))
            .sort((a, b) => b.kwh - a.kwh);

          const totalKwh = deviceUsage.reduce((s, d) => s + d.kwh, 0);
          const daysInMonth = new Date(year, month, 0).getDate();

          return {
            year,
            month,
            totalKwh: Math.round(totalKwh),
            dailyAvgKwh: Math.round(totalKwh / daysInMonth),
            co2Kg: Math.round(totalKwh * CO2_FACTOR_KG_PER_KWH),
            deviceRanking: deviceUsage,
          };
        }),
    }),

    calculateElectricityBill: tool({
      description:
        "根據用電量計算電費。支援住宅累進制、時間電價二段式、三段式",
      inputSchema: z.object({
        kwh: z.number().describe("總用電量 kWh"),
        planType: z
          .enum(["residential", "time_of_use_2", "time_of_use_3"])
          .default("residential")
          .describe("電價方案"),
        month: z
          .number()
          .min(1)
          .max(12)
          .optional()
          .describe("月份（判斷夏月），不填預設當月"),
      }),
      execute: async ({ kwh, planType, month }) => {
        const isSummer = isSummerMonth(month);
        const result = calculateBill({
          kwh,
          planType: planType as PlanType,
          isSummer,
          peakKwh: Math.round(kwh * 0.6),
          offPeakKwh: Math.round(kwh * 0.4),
          midPeakKwh: Math.round(kwh * 0.25),
        });
        return {
          ...result,
          isSummer,
          note: isSummer ? "夏月費率（6-9月）" : "非夏月費率",
        };
      },
    }),

    getUserSettings: tool({
      description: "查詢使用者設定：電價方案、所在地區、家庭人數",
      inputSchema: z.object({}),
      execute: () =>
        withRls(async (tx) => {
          const [settings] = await tx
            .select()
            .from(userSettings)
            .where(eq(userSettings.userId, userId));

          return (
            settings ?? {
              planType: "residential",
              location: "高雄",
              householdSize: 3,
            }
          );
        }),
    }),

    getEnergySavingTips: tool({
      description:
        "根據使用者的設備和用電資料，提供節電建議。會自動分析高耗電設備",
      inputSchema: z.object({}),
      execute: () =>
        withRls(async (tx) => {
          const rows = await tx
            .select()
            .from(devices)
            .where(
              and(eq(devices.userId, userId), eq(devices.isActive, true))
            );

          const tips: string[] = [];
          const highPower = rows
            .filter((d) => d.ratedPowerW >= 1000)
            .sort((a, b) => b.ratedPowerW - a.ratedPowerW);

          for (const d of highPower) {
            const monthlyKwh =
              (d.ratedPowerW * Number(d.dailyHours) * 30) / 1000;
            if (d.category === "aircon" && Number(d.dailyHours) > 6) {
              tips.push(
                `${d.name}每日使用 ${d.dailyHours} 小時，月耗 ${Math.round(monthlyKwh)} kWh。建議搭配電扇，溫度設定 26-28°C，可節省 15-20% 用電`
              );
            } else if (
              d.category === "water_heater" &&
              d.ratedPowerW >= 3000
            ) {
              tips.push(
                `${d.name}（${d.ratedPowerW}W）耗電較高，月耗 ${Math.round(monthlyKwh)} kWh。建議考慮更換熱泵熱水器，可省 60-70% 電費`
              );
            } else {
              tips.push(
                `${d.name}（${d.ratedPowerW}W）月耗 ${Math.round(monthlyKwh)} kWh，建議減少使用時數或選用節能機型`
              );
            }
          }

          if (tips.length === 0) {
            tips.push("您的設備用電都在合理範圍內，繼續保持！");
          }

          return { tips };
        }),
    }),
  };
}
