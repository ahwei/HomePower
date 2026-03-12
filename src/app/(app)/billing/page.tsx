"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { PlanSelector } from "@/components/billing/plan-selector";
import { BillCalculator } from "@/components/billing/bill-calculator";
import { PlanComparisonTable } from "@/components/billing/plan-comparison-table";

export default function BillingPage() {
  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">電費試算</h1>
      </header>
      <main className="flex-1 space-y-6 p-6">
        <PlanSelector />
        <BillCalculator />
        <PlanComparisonTable />
      </main>
    </>
  );
}
