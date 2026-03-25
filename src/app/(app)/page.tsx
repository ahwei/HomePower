import { Suspense } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { GridStatusBanner } from "@/components/dashboard/grid-status-banner";
import { WeatherForecastStrip } from "@/components/dashboard/weather-forecast-strip";
import {
  CardSkeleton,
  OverviewCardsSkeleton,
} from "@/components/dashboard/skeletons";
import {
  EnergyOverviewSection,
  WeeklyChartSection,
  MonthlyChartSection,
  DeviceConsumptionSection,
  TopDevicesSection,
  DailyChartSection,
} from "@/components/dashboard/server-sections";

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

        <Suspense fallback={<OverviewCardsSkeleton />}>
          <EnergyOverviewSection />
        </Suspense>

        <div className="grid gap-4 lg:grid-cols-2">
          <Suspense fallback={<CardSkeleton />}>
            <WeeklyChartSection />
          </Suspense>
          <Suspense fallback={<CardSkeleton />}>
            <MonthlyChartSection />
          </Suspense>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Suspense fallback={<CardSkeleton height="h-48" />}>
            <DeviceConsumptionSection />
          </Suspense>
          <Suspense fallback={<CardSkeleton />}>
            <TopDevicesSection />
          </Suspense>
        </div>

        <Suspense fallback={<CardSkeleton />}>
          <DailyChartSection />
        </Suspense>

        <WeatherForecastStrip />
      </main>
    </>
  );
}
