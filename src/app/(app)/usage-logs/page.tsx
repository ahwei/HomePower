import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";
import { queryUsageLogs } from "@/lib/queries/usage-logs";
import { UsageLogsView } from "@/components/usage-logs/usage-logs-view";

export default async function UsageLogsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const initialData = await queryUsageLogs(supabase, user!.id, {
    startDate: thirtyDaysAgo.toISOString().slice(0, 10),
    endDate: today.toISOString().slice(0, 10),
    sortBy: "date",
    sortOrder: "desc",
    page: 1,
    pageSize: 20,
  });

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">用電紀錄</h1>
      </header>
      <main className="flex-1 p-6">
        <UsageLogsView initialData={initialData} />
      </main>
    </>
  );
}
