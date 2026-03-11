import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export default function DashboardPage() {
  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Dashboard</h1>
      </header>
      <main className="flex-1 p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <PlaceholderCard title="台電即時供電狀態" description="GridStatusBanner" />
          <PlaceholderCard title="本月總用電" description="EnergyOverviewCards" />
          <PlaceholderCard title="預估電費" description="EnergyOverviewCards" />
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <PlaceholderCard title="設備用電佔比" description="DeviceConsumptionChart" className="h-64" />
          <PlaceholderCard title="每日用電趨勢" description="DailyUsageChart" className="h-64" />
        </div>
      </main>
    </>
  );
}

function PlaceholderCard({
  title,
  description,
  className,
}: {
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center text-muted-foreground ${className ?? ""}`}
    >
      <p className="font-medium">{title}</p>
      <p className="text-sm">{description}</p>
    </div>
  );
}
