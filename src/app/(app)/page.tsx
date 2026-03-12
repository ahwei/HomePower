import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { GridStatusBanner } from "@/components/dashboard/grid-status-banner";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { WeatherForecastStrip } from "@/components/dashboard/weather-forecast-strip";

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
        <DashboardContent />
        <WeatherForecastStrip />
      </main>
    </>
  );
}
