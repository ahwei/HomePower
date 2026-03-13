"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, X } from "lucide-react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import {
  useAddDeviceMutation,
  useUpdateDeviceMutation,
} from "@/store/api/devices-api";
import { DEVICE_PRESETS } from "@/constants/device-presets";
import { compressImage, uploadToStorage } from "@/lib/upload-image";
import { toast } from "sonner";
import type { Device } from "@/lib/types";

const schema = z.object({
  preset: z.string().optional(),
  name: z.string().min(1, "請輸入設備名稱"),
  category: z.string().min(1, "請選擇類別"),
  ratedPowerW: z.number().min(1, "功率必須大於 0"),
  dailyHours: z.number().min(0, "時數不能為負").max(24, "時數不能超過 24"),
});

type FormValues = z.infer<typeof schema>;

interface DeviceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device?: Device;
}

export function DeviceDialog({ open, onOpenChange, device }: DeviceDialogProps) {
  const isEdit = !!device;
  const [addDevice] = useAddDeviceMutation();
  const [updateDevice] = useUpdateDeviceMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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

  function handlePresetChange(presetName: string | null) {
    if (!presetName) return;
    const preset = DEVICE_PRESETS.find((p) => p.name === presetName);
    if (!preset) return;
    setValue("name", preset.name);
    setValue("category", preset.category);
    setValue("ratedPowerW", preset.ratedPowerW);
    setValue("dailyHours", preset.dailyHours);
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 800,
      });
      setImageFile(compressed);
      setImagePreview(URL.createObjectURL(compressed));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "圖片處理失敗");
    }
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function onSubmit(data: FormValues) {
    try {
      if (isEdit) {
        let imageUrl = device.imageUrl;
        if (imageFile) {
          imageUrl = await uploadToStorage(
            "device-images",
            `${device.userId}/${device.id}.webp`,
            imageFile
          );
        }
        await updateDevice({
          id: device.id,
          data: {
            name: data.name,
            category: data.category,
            ratedPowerW: data.ratedPowerW,
            dailyHours: data.dailyHours,
            ...(imageFile ? { imageUrl } : {}),
          },
        }).unwrap();
        toast.success(`已更新 ${data.name}`);
      } else {
        const row = await addDevice({
          name: data.name,
          category: data.category,
          ratedPowerW: data.ratedPowerW,
          dailyHours: data.dailyHours,
        }).unwrap();
        if (imageFile) {
          const imageUrl = await uploadToStorage(
            "device-images",
            `${row.userId}/${row.id}.webp`,
            imageFile
          );
          await updateDevice({
            id: row.id,
            data: { imageUrl },
          }).unwrap();
        }
        toast.success(`已新增 ${data.name}`);
      }
      onOpenChange(false);
    } catch {
      toast.error(isEdit ? "更新失敗，請稍後再試" : "新增失敗，請稍後再試");
    }
  }

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open && device) {
      reset({
        name: device.name,
        category: device.category,
        ratedPowerW: device.ratedPowerW,
        dailyHours: device.dailyHours,
      });
      setImagePreview(device.imageUrl || null);
      setImageFile(null);
    } else if (!open) {
      reset();
      clearImage();
    }
  }, [open, device, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "編輯設備" : "新增設備"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "修改設備參數或更換圖片" : "選擇預設模板或自訂設備參數"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 圖片上傳 */}
          <div className="space-y-1.5">
            <Label>設備圖片</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleImageSelect}
            />
            {imagePreview ? (
              <div className="relative h-40 w-full overflow-hidden rounded-lg border">
                <Image
                  src={imagePreview}
                  alt="設備圖片預覽"
                  fill
                  className="object-cover"
                  unoptimized={imagePreview.startsWith("blob:")}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="absolute right-2 top-2 h-7 w-7"
                  onClick={clearImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                className="flex h-40 w-full items-center justify-center rounded-lg border border-dashed text-muted-foreground hover:bg-muted/50"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center gap-1">
                  <ImagePlus className="h-8 w-8" />
                  <span className="text-sm">點擊上傳圖片</span>
                </div>
              </button>
            )}
          </div>

          {/* 預設模板 (only for add mode) */}
          {!isEdit && (
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
          )}

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
