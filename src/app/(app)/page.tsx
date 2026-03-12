import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { GridStatusBanner } from "@/components/dashboard/grid-status-banner";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { WeatherForecastStrip } from "@/components/dashboard/weather-forecast-strip";
import { getDevices } from "@/app/actions/devices";
import type { Device } from "@/lib/types";

function mapRow(
  row: Awaited<ReturnType<typeof getDevices>>[number]
): Device {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    category: row.category as Device["category"],
    ratedPowerW: row.ratedPowerW,
    dailyHours: Number(row.dailyHours),
    isActive: row.isActive,
    schedule: row.schedule as Device["schedule"],
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : String(row.createdAt),
    updatedAt:
      row.updatedAt instanceof Date
        ? row.updatedAt.toISOString()
        : String(row.updatedAt),
  };
}

export default async function DashboardPage() {
  let initialDevices: Device[] = [];
  try {
    const rows = await getDevices();
    initialDevices = rows.map(mapRow);
  } catch {
    // Auth 未就緒時 fallback 空陣列，client 端 RTK Query 會 retry
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Dashboard</h1>
      </header>
      <main className="flex-1 space-y-6 p-6">
        <GridStatusBanner />
        <DashboardContent initialDevices={initialDevices} />
        <WeatherForecastStrip />
      </main>
    </>
  );
}
