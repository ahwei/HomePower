"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Copy, Eye, EyeOff, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createToken } from "@/app/actions/tokens";

const schema = z.object({
  name: z.string().min(1, "請輸入名稱"),
  expiresInDays: z.string(),
});

type FormValues = z.infer<typeof schema>;

interface CreateTokenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function CreateTokenDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateTokenDialogProps) {
  const [rawToken, setRawToken] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", expiresInDays: "never" },
  });

  const handleSubmit = async (values: FormValues) => {
    setIsCreating(true);
    try {
      const days =
        values.expiresInDays === "never"
          ? undefined
          : parseInt(values.expiresInDays);
      const result = await createToken(values.name, days);
      setRawToken(result.rawToken);
      setShowToken(true);
      toast.success("權杖已建立");
    } catch {
      toast.error("建立失敗");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!rawToken) return;
    await navigator.clipboard.writeText(rawToken);
    toast.success("已複製到剪貼簿");
  };

  const mcpConfig = rawToken
    ? JSON.stringify(
        {
          mcpServers: {
            homepower: {
              url: `${typeof window !== "undefined" ? window.location.origin : ""}/api/mcp`,
              headers: {
                Authorization: `Bearer ${rawToken}`,
              },
            },
          },
        },
        null,
        2
      )
    : "";

  const handleCopyConfig = async () => {
    await navigator.clipboard.writeText(mcpConfig);
    toast.success("設定已複製到剪貼簿");
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setRawToken(null);
      setShowToken(false);
      form.reset();
      onCreated();
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {rawToken ? "權杖已建立" : "建立 API 權杖"}
          </DialogTitle>
          <DialogDescription>
            {rawToken
              ? "請立即複製權杖或設定檔，關閉後將無法再次查看。"
              : "建立權杖以透過 MCP 協定存取 HomePower 資料"}
          </DialogDescription>
        </DialogHeader>

        {rawToken ? (
          <div className="space-y-5">
            {/* Token */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">權杖</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-muted px-3 py-2 text-sm font-mono break-all">
                  {showToken ? rawToken : "••••••••••••••••••••••••"}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Button variant="ghost" size="icon" onClick={handleCopy}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* MCP Config */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">
                  MCP 設定
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleCopyConfig}
                >
                  <Copy className="mr-1 h-3 w-3" />
                  複製設定
                </Button>
              </div>
              <pre className="rounded-md bg-muted p-3 text-xs font-mono overflow-x-auto max-h-48">
                {mcpConfig}
              </pre>
            </div>

            {/* Steps */}
            <div className="space-y-2 rounded-md border p-3 text-sm">
              <p className="font-medium">使用方式</p>
              <ol className="list-inside list-decimal space-y-1 text-muted-foreground text-xs">
                <li>
                  <strong>Claude Desktop</strong>：將上方設定貼到{" "}
                  <code className="rounded bg-muted px-1">
                    claude_desktop_config.json
                  </code>
                </li>
                <li>
                  <strong>Claude Code</strong>：將設定加到{" "}
                  <code className="rounded bg-muted px-1">.mcp.json</code>
                </li>
                <li>
                  <strong>MCP Inspector</strong>：使用 URL{" "}
                  <code className="rounded bg-muted px-1">
                    {typeof window !== "undefined"
                      ? window.location.origin
                      : ""}/api/mcp
                  </code>{" "}
                  搭配 Bearer token
                </li>
              </ol>
            </div>

            <DialogFooter>
              <Button onClick={() => handleClose(false)}>
                <Check className="mr-2 h-4 w-4" />
                完成
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">名稱</Label>
              <Input
                id="name"
                placeholder="例如：Claude Desktop"
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="expires">有效期限</Label>
              <Select
                value={form.watch("expiresInDays")}
                onValueChange={(v) => form.setValue("expiresInDays", v ?? "never")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">永不過期</SelectItem>
                  <SelectItem value="30">30 天</SelectItem>
                  <SelectItem value="90">90 天</SelectItem>
                  <SelectItem value="365">1 年</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "建立中..." : "建立權杖"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
