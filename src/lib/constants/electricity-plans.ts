import type { ElectricityPlan } from "@/lib/types";

/**
 * 台電電價方案定義
 * 費率依據台電官網公告（2024 年版本）
 */
export const ELECTRICITY_PLANS: ElectricityPlan[] = [
  {
    id: "residential",
    name: "住宅電價（累進制）",
    type: "residential",
    tiers: [
      { min: 0, max: 120, summerRate: 1.68, nonSummerRate: 1.68 },
      { min: 121, max: 330, summerRate: 2.45, nonSummerRate: 2.16 },
      { min: 331, max: 500, summerRate: 3.70, nonSummerRate: 3.03 },
      { min: 501, max: 700, summerRate: 5.04, nonSummerRate: 4.14 },
      { min: 701, max: 1000, summerRate: 6.03, nonSummerRate: 5.07 },
      { min: 1001, max: null, summerRate: 8.46, nonSummerRate: 6.63 },
    ],
  },
  {
    id: "time_of_use_2",
    name: "時間電價（二段式）",
    type: "time_of_use_2",
    tiers: [
      // 尖峰
      { min: 0, max: null, summerRate: 4.71, nonSummerRate: 4.37 },
      // 離峰
      { min: 0, max: null, summerRate: 1.85, nonSummerRate: 1.78 },
    ],
    peakHours: { start: 7, end: 22 }, // 07:30-22:30 簡化為 7-22
  },
  {
    id: "time_of_use_3",
    name: "時間電價（三段式）",
    type: "time_of_use_3",
    tiers: [
      // 尖峰
      { min: 0, max: null, summerRate: 6.49, nonSummerRate: 6.13 },
      // 半尖峰
      { min: 0, max: null, summerRate: 4.31, nonSummerRate: 4.10 },
      // 離峰
      { min: 0, max: null, summerRate: 1.85, nonSummerRate: 1.78 },
    ],
    peakHours: { start: 16, end: 22 }, // 尖峰 16:00-22:00
  },
];

/** 夏月判斷（6-9 月） */
export function isSummerMonth(month?: number): boolean {
  const m = month ?? new Date().getMonth() + 1;
  return m >= 6 && m <= 9;
}

/** 依 ID 取得方案 */
export function getPlanById(planId: string): ElectricityPlan | undefined {
  return ELECTRICITY_PLANS.find((p) => p.id === planId);
}
