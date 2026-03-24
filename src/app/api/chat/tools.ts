import { tool } from "ai";
import { z } from "zod/v4";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { queryDevicesForTool, queryDeviceSummary, queryEnergySavingTips } from "@/queries/devices";
import { queryUsageByDateRange, queryMonthlyUsageSummary } from "@/queries/usage-logs";
import { queryGetUserSettings } from "@/queries/user-settings";
import { calculateBill } from "@/components/billing/calculate-bill";
import { isSummerMonth } from "@/constants/electricity-plans";
import type { PlanType } from "@/lib/types";

export function createTools(
  supabase: SupabaseClient<Database>,
  userId: string
) {
  return {
    getDevices: tool({
      description:
        "查詢使用者的所有家電設備，包含名稱、類別、額定功率、每日使用時數、是否啟用",
      inputSchema: z.object({}),
      execute: () => queryDevicesForTool(supabase, userId),
    }),

    getDeviceSummary: tool({
      description:
        "取得設備統計摘要：總數、啟用數、預估月總用電量、各類別用電佔比",
      inputSchema: z.object({}),
      execute: () => queryDeviceSummary(supabase, userId),
    }),

    getUsageByDateRange: tool({
      description:
        "查詢指定日期區間的每日用電量（kWh），可用於趨勢分析、月度比較",
      inputSchema: z.object({
        startDate: z.string().describe("起始日期 YYYY-MM-DD"),
        endDate: z.string().describe("結束日期 YYYY-MM-DD"),
      }),
      execute: ({ startDate, endDate }) =>
        queryUsageByDateRange(supabase, userId, startDate, endDate),
    }),

    getMonthlyUsageSummary: tool({
      description:
        "查詢指定年月的月度用電摘要：總 kWh、日均 kWh、各設備用電排名",
      inputSchema: z.object({
        year: z.number().describe("年份，例如 2026"),
        month: z.number().min(1).max(12).describe("月份 1-12"),
      }),
      execute: ({ year, month }) =>
        queryMonthlyUsageSummary(supabase, userId, year, month),
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
      execute: () => queryGetUserSettings(supabase, userId),
    }),

    getEnergySavingTips: tool({
      description:
        "根據使用者的設備和用電資料，提供節電建議。會自動分析高耗電設備",
      inputSchema: z.object({}),
      execute: () => queryEnergySavingTips(supabase, userId),
    }),
  };
}
