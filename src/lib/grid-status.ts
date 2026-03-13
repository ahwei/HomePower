import type { GridStatus, GridStatusLevel } from "@/lib/types";

const TAIPOWER_URL =
  "https://www.taipower.com.tw/d006/loadGraph/loadGraph/data/loadpara.json";

function getStatusLevel(reservePercent: number): GridStatusLevel {
  if (reservePercent >= 10) return "green";
  if (reservePercent >= 6) return "yellow";
  if (reservePercent >= 3) return "orange";
  return "red";
}

function indicatorToLevel(indicator: string): GridStatusLevel {
  const map: Record<string, GridStatusLevel> = {
    G: "green",
    Y: "yellow",
    O: "orange",
    R: "red",
  };
  return map[indicator] ?? "green";
}

export async function fetchGridStatus(): Promise<GridStatus> {
  const res = await fetch(TAIPOWER_URL, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error("台電 API 暫時無法連線");

  const raw = await res.json();
  const records = raw?.records;
  if (!Array.isArray(records) || records.length < 2)
    throw new Error("資料格式錯誤");

  const current = records[0];
  const forecast = records[1];
  const yesterday = records[2];

  const supplyCapacityMW =
    parseFloat(forecast.fore_maxi_sply_capacity) || 0;
  const currentLoadMW = parseFloat(current.curr_load) || 0;
  const reserveMarginPercent =
    parseFloat(forecast.fore_peak_resv_rate) || 0;
  const usagePercent = parseFloat(current.curr_util_rate) || 0;
  const reserveCapacityMW =
    parseFloat(forecast.fore_peak_resv_capacity) || 0;
  const forecastPeakLoadMW =
    parseFloat(forecast.fore_peak_dema_load) || 0;

  const status = forecast.fore_peak_resv_indicator
    ? indicatorToLevel(forecast.fore_peak_resv_indicator)
    : getStatusLevel(reserveMarginPercent);

  return {
    status,
    supplyCapacityMW: Math.round(supplyCapacityMW),
    currentLoadMW: Math.round(currentLoadMW),
    reserveMarginPercent: Number(reserveMarginPercent.toFixed(2)),
    usagePercent,
    reserveCapacityMW: Math.round(reserveCapacityMW),
    forecastPeakLoadMW: Math.round(forecastPeakLoadMW),
    peakHourRange: forecast.fore_peak_hour_range ?? "",
    publishTime: forecast.publish_time ?? "",
    yesterday: {
      supplyCapacityMW: Math.round(
        parseFloat(yesterday?.yday_maxi_sply_capacity) || 0
      ),
      peakLoadMW: Math.round(
        parseFloat(yesterday?.yday_peak_dema_load) || 0
      ),
      reserveRate: parseFloat(yesterday?.yday_peak_resv_rate) || 0,
    },
    updatedAt: new Date().toISOString(),
  };
}
