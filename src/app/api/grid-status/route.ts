import { NextResponse } from "next/server";
import type { GridStatus, GridStatusLevel } from "@/lib/types";

export const revalidate = 300; // 5 分鐘

const TAIPOWER_URL =
  "https://www.taipower.com.tw/d006/loadGraph/loadGraph/data/loadpara.json";

function getStatusLevel(reservePercent: number): GridStatusLevel {
  if (reservePercent >= 10) return "green";
  if (reservePercent >= 6) return "yellow";
  if (reservePercent >= 3) return "orange";
  return "red";
}

// 燈號指標對應: G=green, Y=yellow, O=orange, R=red
function indicatorToLevel(indicator: string): GridStatusLevel {
  switch (indicator) {
    case "G":
      return "green";
    case "Y":
      return "yellow";
    case "O":
      return "orange";
    case "R":
      return "red";
    default:
      return "green";
  }
}

export async function GET() {
  try {
    const res = await fetch(TAIPOWER_URL, { next: { revalidate: 300 } });

    if (!res.ok) {
      return NextResponse.json(
        { error: "台電 API 暫時無法連線" },
        { status: 503 }
      );
    }

    const raw = await res.json();
    const records = raw?.records;

    if (!Array.isArray(records) || records.length < 2) {
      return NextResponse.json(
        { error: "資料格式錯誤" },
        { status: 502 }
      );
    }

    // records[0]: 即時負載 { curr_load, curr_util_rate }
    // records[1]: 今日預估 { fore_maxi_sply_capacity, fore_peak_dema_load, fore_peak_resv_rate, fore_peak_resv_indicator }
    const current = records[0];
    const forecast = records[1];

    const supplyCapacityMW = parseFloat(forecast.fore_maxi_sply_capacity) || 0;
    const currentLoadMW = parseFloat(current.curr_load) || 0;
    const reserveMarginPercent =
      parseFloat(forecast.fore_peak_resv_rate) || 0;

    // 優先使用台電官方燈號，fallback 用自算
    const status = forecast.fore_peak_resv_indicator
      ? indicatorToLevel(forecast.fore_peak_resv_indicator)
      : getStatusLevel(reserveMarginPercent);

    const data: GridStatus = {
      status,
      supplyCapacityMW: Math.round(supplyCapacityMW),
      currentLoadMW: Math.round(currentLoadMW),
      reserveMarginPercent: Number(reserveMarginPercent.toFixed(2)),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "台電 API 暫時無法連線" },
      { status: 503 }
    );
  }
}
