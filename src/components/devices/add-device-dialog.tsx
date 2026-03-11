"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAppDispatch } from "@/hooks/use-store";
import { addDevice } from "@/store/slices/devices-slice";
import { DEVICE_PRESETS } from "@/constants/device-presets";
import { toast } from "sonner";

const schema = z.object({
  preset: z.string().optional(),
  name: z.string().min(1, "請輸入設備名稱"),
  category: z.string().min(1, "請選擇類別"),
  ratedPowerW: z.number().min(1, "功率必須大於 0"),
  dailyHours: z.number().min(0, "時數不能為負").max(24, "時數不能超過 24"),
});

type FormValues = z.infer<typeof schema>;

interface AddDeviceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddDeviceDialog({ open, onOpenChange }: AddDeviceDialogProps) {
  const dispatch = useAppDispatch();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      category: "",
      ratedPowerW: 0,
      dailyHours: 0,
    },
  });

  const ratedPowerW = watch("ratedPowerW");
  const dailyHours = watch("dailyHours");
  const estimatedKwh = ((ratedPowerW || 0) * (dailyHours || 0) * 30) / 1000;

  // 選擇預設模板時自動帶入
  function handlePresetChange(presetName: string | null) {
    if (!presetName) return;
    const preset = DEVICE_PRESETS.find((p) => p.name === presetName);
    if (!preset) return;
    setValue("name", preset.name);
    setValue("category", preset.category);
    setValue("ratedPowerW", preset.ratedPowerW);
    setValue("dailyHours", preset.dailyHours);
  }

  async function onSubmit(data: FormValues) {
    try {
      await dispatch(
        addDevice({
          name: data.name,
          category: data.category,
          ratedPowerW: data.ratedPowerW,
          dailyHours: data.dailyHours,
        })
      ).unwrap();
      toast.success(`已新增 ${data.name}`);
      onOpenChange(false);
    } catch {
      toast.error("新增失敗，請稍後再試");
    }
  }

  // 關閉時重置表單
  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>新增設備</DialogTitle>
          <DialogDescription>選擇預設模板或自訂設備參數</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 預設模板 */}
          <div className="space-y-1.5">
            <Label>設備模板</Label>
            <Select onValueChange={handlePresetChange}>
              <SelectTrigger>
                <SelectValue placeholder="選擇預設設備..." />
              </SelectTrigger>
              <SelectContent>
                {DEVICE_PRESETS.map((p) => (
                  <SelectItem key={p.name} value={p.name}>
                    {p.name} ({p.ratedPowerW}W)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 設備名稱 */}
          <div className="space-y-1.5">
            <Label htmlFor="name">設備名稱</Label>
            <Input id="name" {...register("name")} />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* 額定功率 */}
          <div className="space-y-1.5">
            <Label htmlFor="ratedPowerW">額定功率 (W)</Label>
            <Input
              id="ratedPowerW"
              type="number"
              {...register("ratedPowerW", { valueAsNumber: true })}
            />
            {errors.ratedPowerW && (
              <p className="text-xs text-destructive">
                {errors.ratedPowerW.message}
              </p>
            )}
          </div>

          {/* 每日使用時數 */}
          <div className="space-y-1.5">
            <Label htmlFor="dailyHours">每日使用時數</Label>
            <Input
              id="dailyHours"
              type="number"
              step="0.5"
              {...register("dailyHours", { valueAsNumber: true })}
            />
            {errors.dailyHours && (
              <p className="text-xs text-destructive">
                {errors.dailyHours.message}
              </p>
            )}
          </div>

          {/* 預估月用電 */}
          <div className="rounded-lg bg-muted p-3 text-center">
            <p className="text-sm text-muted-foreground">預估月用電</p>
            <p className="text-2xl font-bold">
              {Math.round(estimatedKwh)} kWh
            </p>
          </div>

          <input type="hidden" {...register("category")} />

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "儲存中..." : "儲存"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
