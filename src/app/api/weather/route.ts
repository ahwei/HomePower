import { NextRequest, NextResponse } from "next/server";
import { fetchWeatherForecast } from "@/lib/weather";

export const revalidate = 3600; // 1 小時

export async function GET(request: NextRequest) {
  const location =
    request.nextUrl.searchParams.get("location") || "高雄市";

  try {
    const data = await fetchWeatherForecast(location);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "氣象 API 暫時無法連線" },
      { status: 503 }
    );
  }
}
