"use client";

import { useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { DeviceList } from "@/components/devices/device-list";
import { DeviceDialog } from "@/components/devices/device-dialog";
import type { Device } from "@/lib/types";

export default function DevicesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDevice, setEditDevice] = useState<Device | undefined>();

  function handleAdd() {
    setEditDevice(undefined);
    setDialogOpen(true);
  }

  function handleEdit(device: Device) {
    setEditDevice(device);
    setDialogOpen(true);
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">設備管理</h1>
      </header>
      <main className="flex-1 p-6">
        <DeviceList onAddClick={handleAdd} onEdit={handleEdit} />
        <DeviceDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          device={editDevice}
        />
      </main>
    </>
  );
}
