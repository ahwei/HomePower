import type { WeatherForecast } from "@/lib/types";

const CWA_BASE = "https://opendata.cwa.gov.tw/api/v1/rest/datastore";

function estimateAcHours(highTemp: number): number {
  if (highTemp < 26) return 0;
  if (highTemp <= 29) return 4;
  if (highTemp <= 33) return 8;
  if (highTemp <= 36) return 12;
  return 16;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseForecast(data: any): WeatherForecast[] {
  try {
    const locations = data?.records?.locations?.[0]?.location;
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
        dateMap.set(dateStr, {
          highTemp: high,
          lowTemp: low,
          description: desc,
        });
      } else {
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

export function getFallbackForecasts(): WeatherForecast[] {
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

export async function fetchWeatherForecast(
  location: string = "高雄市"
): Promise<{ location: string; forecasts: WeatherForecast[] }> {
  const apiKey = process.env.CWA_API_KEY;
  if (!apiKey) throw new Error("CWA_API_KEY 未設定");

  const url = `${CWA_BASE}/F-D0047-091?Authorization=${apiKey}&locationName=${encodeURIComponent(location)}&elementName=MaxT,MinT,Wx`;
  const res = await fetch(url, { next: { revalidate: 3600 } });

  if (res.status === 429 || !res.ok) {
    return { location, forecasts: getFallbackForecasts() };
  }

  const data = await res.json();
  const forecasts = parseForecast(data);
  if (forecasts.length === 0) {
    return { location, forecasts: getFallbackForecasts() };
  }
  return { location, forecasts };
}
