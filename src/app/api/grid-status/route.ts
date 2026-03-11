import { NextResponse } from "next/server";
import type { GridStatus, GridStatusLevel } from "@/lib/types";

export const revalidate = 300; // 5 分鐘

const TAIPOWER_URL =
  "https://data.taipower.com.tw/opendata/apply/file/d006001/001.json";

function getStatusLevel(reservePercent: number): GridStatusLevel {
  if (reservePercent >= 10) return "green";
  if (reservePercent >= 6) return "yellow";
  if (reservePercent >= 3) return "orange";
  return "red";
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

    // 台電 API 回傳格式解析
    // 主要欄位在 aaData 陣列，最後一筆為總計
    const records = raw?.aaData;
    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { error: "資料格式錯誤" },
        { status: 502 }
      );
    }

    // 取得供電資訊 — 從台電 JSON 的 summary 或自行計算
    // 嘗試從 JSON 結構取出總供電量與負載
    let supplyCapacityMW = 0;
    let currentLoadMW = 0;

    for (const record of records) {
      // 每筆 record: [機組名稱, 裝置容量, 淨發電量, ...]
      // 最後一筆通常為合計
      const capacity = parseFloat(record[1]);
      const generation = parseFloat(record[2]);
      if (!isNaN(capacity)) supplyCapacityMW += capacity;
      if (!isNaN(generation)) currentLoadMW += generation;
    }

    // 如果解析失敗，嘗試備用欄位
    if (supplyCapacityMW === 0 || currentLoadMW === 0) {
      // 嘗試從最後一筆取合計
      const last = records[records.length - 1];
      supplyCapacityMW = parseFloat(last?.[1]) || 0;
      currentLoadMW = parseFloat(last?.[2]) || 0;
    }

    if (supplyCapacityMW === 0) {
      return NextResponse.json(
        { error: "資料格式錯誤" },
        { status: 502 }
      );
    }

    const reserveMarginPercent = Number(
      (((supplyCapacityMW - currentLoadMW) / supplyCapacityMW) * 100).toFixed(2)
    );

    const data: GridStatus = {
      status: getStatusLevel(reserveMarginPercent),
      supplyCapacityMW: Math.round(supplyCapacityMW),
      currentLoadMW: Math.round(currentLoadMW),
      reserveMarginPercent,
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
