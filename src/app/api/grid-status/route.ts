import { NextResponse } from "next/server";
import { fetchGridStatus } from "@/lib/grid-status";

export const revalidate = 300; // 5 分鐘

export async function GET() {
  try {
    const data = await fetchGridStatus();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "台電 API 暫時無法連線" },
      { status: 503 }
    );
  }
}
