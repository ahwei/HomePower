import { NextRequest, NextResponse } from "next/server";
import { calculateBill } from "@/components/billing/calculate-bill";
import type { PlanType } from "@/lib/types";

const VALID_PLAN_TYPES: PlanType[] = [
  "residential",
  "time_of_use_2",
  "time_of_use_3",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { kwh, planType, isSummer, peakKwh, offPeakKwh, midPeakKwh } = body;

    // 驗證 planType
    if (!VALID_PLAN_TYPES.includes(planType)) {
      return NextResponse.json(
        { error: "不支援的電價方案" },
        { status: 400 }
      );
    }

    // 驗證 kwh
    if (planType === "residential") {
      if (typeof kwh !== "number" || kwh < 0) {
        return NextResponse.json(
          { error: "請輸入有效的用電度數" },
          { status: 400 }
        );
      }
    }

    const result = calculateBill({
      kwh: kwh ?? 0,
      planType,
      isSummer: !!isSummer,
      peakKwh,
      offPeakKwh,
      midPeakKwh,
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "請輸入有效的用電度數" },
      { status: 400 }
    );
  }
}
