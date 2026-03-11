"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAppDispatch, useAppSelector } from "@/hooks/use-store";
import { setPlanType, setIsSummer } from "@/store/slices/settings-slice";
import { ELECTRICITY_PLANS } from "@/constants/electricity-plans";
import type { PlanType } from "@/lib/types";

export function PlanSelector() {
  const dispatch = useAppDispatch();
  const { planType, isSummer } = useAppSelector((s) => s.settings);

  return (
    <div
      data-testid="plan-selector"
      className="flex flex-wrap items-center gap-4"
    >
      <div className="space-y-1.5">
        <Label>電價方案</Label>
        <Select
          value={planType}
          onValueChange={(v) => dispatch(setPlanType(v as PlanType))}
        >
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ELECTRICITY_PLANS.map((plan) => (
              <SelectItem key={plan.id} value={plan.id}>
                {plan.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id="summer-toggle"
          checked={isSummer}
          onCheckedChange={(v) => dispatch(setIsSummer(v))}
        />
        <Label htmlFor="summer-toggle">
          {isSummer ? "夏月（6-9月）" : "非夏月"}
        </Label>
      </div>
    </div>
  );
}
