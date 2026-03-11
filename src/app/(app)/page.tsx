import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { GridStatusBanner } from "@/features/dashboard/components/grid-status-banner";
import { EnergyOverviewCards } from "@/features/dashboard/components/energy-overview-cards";
import { DeviceConsumptionChart } from "@/features/dashboard/components/device-consumption-chart";
import { DailyUsageChart } from "@/features/dashboard/components/daily-usage-chart";
import { WeatherForecastStrip } from "@/features/dashboard/components/weather-forecast-strip";

export default function DashboardPage() {
  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Dashboard</h1>
      </header>
      <main className="flex-1 space-y-6 p-6">
        <GridStatusBanner />
        <EnergyOverviewCards />
        <div className="grid gap-4 lg:grid-cols-2">
          <DeviceConsumptionChart />
          <DailyUsageChart />
        </div>
        <WeatherForecastStrip />
      </main>
    </>
  );
}
