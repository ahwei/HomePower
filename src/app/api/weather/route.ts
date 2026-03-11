import { NextRequest, NextResponse } from "next/server";
import type { WeatherForecast } from "@/lib/types";

export const revalidate = 3600; // 1 小時

const CWA_BASE = "https://opendata.cwa.gov.tw/api/v1/rest/datastore";

function estimateAcHours(highTemp: number): number {
  if (highTemp < 26) return 0;
  if (highTemp <= 29) return 4;
  if (highTemp <= 33) return 8;
  if (highTemp <= 36) return 12;
  return 16;
}

/** 取得中央氣象署 3 天 / 一週預報 */
async function fetchCwaForecast(location: string, apiKey: string) {
  // 一般天氣預報-今明 36 小時 + 一週預報
  // F-D0047-091 為全臺縣市一週天氣預報
  const url = `${CWA_BASE}/F-D0047-091?Authorization=${apiKey}&locationName=${encodeURIComponent(location)}&elementName=MaxT,MinT,Wx`;

  const res = await fetch(url, { next: { revalidate: 3600 } });

  if (res.status === 429) return null; // rate limited
  if (!res.ok) throw new Error(`CWA API ${res.status}`);

  return res.json();
}

/** 解析氣象署 JSON → WeatherForecast[] */
function parseForecast(data: Record<string, unknown>): WeatherForecast[] {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const locations = (data as any)?.records?.locations?.[0]?.location;
    if (!locations || locations.length === 0) return [];

    const loc = locations[0];
    const elements = loc.weatherElement as Array<{
      elementName: string;
      time: Array<{
        startTime: string;
        elementValue: Array<{ value: string }>;
      }>;
    }>;

    const maxTEl = elements.find((e) => e.elementName === "MaxT");
    const minTEl = elements.find((e) => e.elementName === "MinT");
    const wxEl = elements.find((e) => e.elementName === "Wx");

    if (!maxTEl || !minTEl || !wxEl) return [];

    // 按日期分組（每天取一筆）
    const dateMap = new Map<
      string,
      { highTemp: number; lowTemp: number; description: string }
    >();

    for (let i = 0; i < maxTEl.time.length; i++) {
      const dateStr = maxTEl.time[i].startTime.slice(0, 10);
      const high = parseInt(maxTEl.time[i].elementValue[0].value);
      const low = parseInt(minTEl.time[i]?.elementValue[0]?.value ?? "0");
      const desc = wxEl.time[i]?.elementValue[0]?.value ?? "";

      const existing = dateMap.get(dateStr);
      if (!existing) {
        dateMap.set(dateStr, { highTemp: high, lowTemp: low, description: desc });
      } else {
        // 取較高的最高溫、較低的最低溫
        existing.highTemp = Math.max(existing.highTemp, high);
        existing.lowTemp = Math.min(existing.lowTemp, low);
      }
    }

    const forecasts: WeatherForecast[] = [];
    for (const [date, { highTemp, lowTemp, description }] of dateMap) {
      forecasts.push({
        date,
        highTemp,
        lowTemp,
        description,
        estimatedAcHours: estimateAcHours(highTemp),
      });
    }

    return forecasts.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 7);
  } catch {
    return [];
  }
}

/** 靜態預設天氣（當 API 不可用時） */
function getFallbackForecasts(): WeatherForecast[] {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return {
      date: d.toISOString().slice(0, 10),
      highTemp: 30,
      lowTemp: 24,
      description: "多雲",
      estimatedAcHours: 8,
    };
  });
}

export async function GET(request: NextRequest) {
  const apiKey = process.env.CWA_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "CWA_API_KEY 未設定" },
      { status: 500 }
    );
  }

  const location =
    request.nextUrl.searchParams.get("location") || "高雄市";

  try {
    const data = await fetchCwaForecast(location, apiKey);

    // Rate limited → fallback
    if (data === null) {
      return NextResponse.json(
        { location, forecasts: getFallbackForecasts() },
        { headers: { "X-Fallback": "true" } }
      );
    }

    const forecasts = parseForecast(data);
    if (forecasts.length === 0) {
      return NextResponse.json(
        { location, forecasts: getFallbackForecasts() },
        { headers: { "X-Fallback": "true" } }
      );
    }

    return NextResponse.json({ location, forecasts });
  } catch {
    return NextResponse.json(
      { error: "氣象 API 暫時無法連線" },
      { status: 503 }
    );
  }
}
