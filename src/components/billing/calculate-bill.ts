import type { BillResult, PlanType, TierBreakdown } from "@/lib/types";
import { ELECTRICITY_PLANS } from "@/constants/electricity-plans";

/**
 * 住宅累進電價計算
 */
export function calculateResidentialBill(
  kwh: number,
  isSummer: boolean
): BillResult {
  const plan = ELECTRICITY_PLANS.find((p) => p.type === "residential")!;
  const breakdown: TierBreakdown[] = [];
  let remaining = kwh;
  let totalAmount = 0;

  for (const tier of plan.tiers) {
    if (remaining <= 0) break;

    const tierRange = tier.max !== null ? tier.max - tier.min + 1 : remaining;
    const tierKwh = Math.min(remaining, tierRange);
    const rate = isSummer ? tier.summerRate : tier.nonSummerRate;
    const amount = Number((tierKwh * rate).toFixed(2));

    breakdown.push({
      tier: tier.max !== null ? `${tier.min + 1}-${tier.max}度` : `${tier.min + 1}度以上`,
      kwh: tierKwh,
      rate,
      amount,
    });

    totalAmount += amount;
    remaining -= tierKwh;
  }

  // 修正第一級標籤
  if (breakdown.length > 0) {
    breakdown[0].tier = `1-120度`;
  }

  return {
    totalAmount: Number(totalAmount.toFixed(2)),
    breakdown,
    avgRate: kwh > 0 ? Number((totalAmount / kwh).toFixed(2)) : 0,
    planType: "residential",
    isSummer,
  };
}

/**
 * 時間電價二段式
 */
export function calculateTimeOfUse2Bill(
  peakKwh: number,
  offPeakKwh: number,
  isSummer: boolean
): BillResult {
  const plan = ELECTRICITY_PLANS.find((p) => p.type === "time_of_use_2")!;
  const peakRate = isSummer
    ? plan.tiers[0].summerRate
    : plan.tiers[0].nonSummerRate;
  const offPeakRate = isSummer
    ? plan.tiers[1].summerRate
    : plan.tiers[1].nonSummerRate;

  const peakAmount = Number((peakKwh * peakRate).toFixed(2));
  const offPeakAmount = Number((offPeakKwh * offPeakRate).toFixed(2));
  const totalAmount = Number((peakAmount + offPeakAmount).toFixed(2));
  const totalKwh = peakKwh + offPeakKwh;

  return {
    totalAmount,
    breakdown: [
      { tier: "尖峰", kwh: peakKwh, rate: peakRate, amount: peakAmount },
      {
        tier: "離峰",
        kwh: offPeakKwh,
        rate: offPeakRate,
        amount: offPeakAmount,
      },
    ],
    avgRate: totalKwh > 0 ? Number((totalAmount / totalKwh).toFixed(2)) : 0,
    planType: "time_of_use_2",
    isSummer,
  };
}

/**
 * 時間電價三段式
 */
export function calculateTimeOfUse3Bill(
  peakKwh: number,
  midPeakKwh: number,
  offPeakKwh: number,
  isSummer: boolean
): BillResult {
  const plan = ELECTRICITY_PLANS.find((p) => p.type === "time_of_use_3")!;
  const peakRate = isSummer
    ? plan.tiers[0].summerRate
    : plan.tiers[0].nonSummerRate;
  const midRate = isSummer
    ? plan.tiers[1].summerRate
    : plan.tiers[1].nonSummerRate;
  const offPeakRate = isSummer
    ? plan.tiers[2].summerRate
    : plan.tiers[2].nonSummerRate;

  const peakAmount = Number((peakKwh * peakRate).toFixed(2));
  const midAmount = Number((midPeakKwh * midRate).toFixed(2));
  const offPeakAmount = Number((offPeakKwh * offPeakRate).toFixed(2));
  const totalAmount = Number(
    (peakAmount + midAmount + offPeakAmount).toFixed(2)
  );
  const totalKwh = peakKwh + midPeakKwh + offPeakKwh;

  return {
    totalAmount,
    breakdown: [
      { tier: "尖峰", kwh: peakKwh, rate: peakRate, amount: peakAmount },
      { tier: "半尖峰", kwh: midPeakKwh, rate: midRate, amount: midAmount },
      {
        tier: "離峰",
        kwh: offPeakKwh,
        rate: offPeakRate,
        amount: offPeakAmount,
      },
    ],
    avgRate: totalKwh > 0 ? Number((totalAmount / totalKwh).toFixed(2)) : 0,
    planType: "time_of_use_3",
    isSummer,
  };
}

/**
 * 統一入口 — 依 planType 分派計算
 */
export function calculateBill(params: {
  kwh: number;
  planType: PlanType;
  isSummer: boolean;
  peakKwh?: number;
  offPeakKwh?: number;
  midPeakKwh?: number;
}): BillResult {
  switch (params.planType) {
    case "residential":
      return calculateResidentialBill(params.kwh, params.isSummer);
    case "time_of_use_2":
      return calculateTimeOfUse2Bill(
        params.peakKwh ?? 0,
        params.offPeakKwh ?? 0,
        params.isSummer
      );
    case "time_of_use_3":
      return calculateTimeOfUse3Bill(
        params.peakKwh ?? 0,
        params.midPeakKwh ?? 0,
        params.offPeakKwh ?? 0,
        params.isSummer
      );
    default:
      throw new Error(`不支援的電價方案: ${params.planType}`);
  }
}
