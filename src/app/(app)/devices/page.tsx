import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export default function DevicesPage() {
  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">設備管理</h1>
      </header>
      <main className="flex-1 p-6">
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          <p className="font-medium">設備列表</p>
          <p className="text-sm">DeviceList + AddDeviceDialog</p>
        </div>
      </main>
    </>
  );
}
