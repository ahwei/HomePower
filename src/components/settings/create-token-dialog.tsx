"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Copy, Eye, EyeOff, Check } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { createToken } from "@/actions/tokens";

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

  const [configTab, setConfigTab] = useState("claude-code");

  const mcpUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/mcp`
      : "/api/mcp";

  const claudeCodeConfig = rawToken
    ? JSON.stringify(
        {
          mcpServers: {
            homepower: {
              url: mcpUrl,
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

  const claudeCodeCli = rawToken
    ? `claude mcp add homepower --transport http "${mcpUrl}" --header "Authorization: Bearer ${rawToken}"`
    : "";

  const claudeDesktopConfig = rawToken
    ? JSON.stringify(
        {
          mcpServers: {
            homepower: {
              command: "npx",
              args: [
                "mcp-remote",
                mcpUrl,
                "--header",
                `Authorization: Bearer ${rawToken}`,
              ],
            },
          },
        },
        null,
        2
      )
    : "";

  const vscodeConfig = rawToken
    ? JSON.stringify(
        {
          servers: {
            homepower: {
              type: "http",
              url: mcpUrl,
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

  const chatgptConfig = rawToken
    ? JSON.stringify(
        {
          type: "mcp",
          name: "homepower",
          url: mcpUrl,
          headers: {
            Authorization: `Bearer ${rawToken}`,
          },
        },
        null,
        2
      )
    : "";

  const configMap: Record<string, string> = {
    "claude-code": claudeCodeConfig,
    "claude-cli": claudeCodeCli,
    "claude-desktop": claudeDesktopConfig,
    "vscode": vscodeConfig,
    "chatgpt": chatgptConfig,
  };

  const handleCopyConfig = async () => {
    await navigator.clipboard.writeText(configMap[configTab] ?? "");
    toast.success("已複製到剪貼簿");
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
      <DialogContent className="sm:max-w-2xl">
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

            {/* MCP Config with Tabs */}
            <Tabs
              value={configTab}
              onValueChange={(v) => setConfigTab(v ?? configTab)}
            >
              <div className="flex items-center justify-between gap-2">
                <TabsList className="h-8 flex-wrap">
                  <TabsTrigger value="claude-code" className="text-xs px-2">
                    .mcp.json
                  </TabsTrigger>
                  <TabsTrigger value="claude-cli" className="text-xs px-2">
                    CLI
                  </TabsTrigger>
                  <TabsTrigger value="claude-desktop" className="text-xs px-2">
                    Desktop
                  </TabsTrigger>
                  <TabsTrigger value="vscode" className="text-xs px-2">
                    Copilot / Codex
                  </TabsTrigger>
                  <TabsTrigger value="chatgpt" className="text-xs px-2">
                    ChatGPT
                  </TabsTrigger>
                </TabsList>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 shrink-0 text-xs"
                  onClick={handleCopyConfig}
                >
                  <Copy className="mr-1 h-3 w-3" />
                  複製
                </Button>
              </div>

              <TabsContent value="claude-code" className="mt-2 space-y-2">
                <pre className="rounded-md bg-muted p-3 text-xs font-mono overflow-x-auto max-h-48 whitespace-pre-wrap break-all">
                  {claudeCodeConfig}
                </pre>
                <p className="text-xs text-muted-foreground">
                  貼到專案根目錄的{" "}
                  <code className="rounded bg-muted px-1">.mcp.json</code>
                </p>
              </TabsContent>

              <TabsContent value="claude-cli" className="mt-2 space-y-2">
                <pre className="rounded-md bg-muted p-3 text-xs font-mono overflow-x-auto max-h-48 whitespace-pre-wrap break-all">
                  {claudeCodeCli}
                </pre>
                <p className="text-xs text-muted-foreground">
                  在終端機直接執行，Claude Code 會自動新增 MCP 設定
                </p>
              </TabsContent>

              <TabsContent value="claude-desktop" className="mt-2 space-y-2">
                <pre className="rounded-md bg-muted p-3 text-xs font-mono overflow-x-auto max-h-48 whitespace-pre-wrap break-all">
                  {claudeDesktopConfig}
                </pre>
                <p className="text-xs text-muted-foreground">
                  貼到{" "}
                  <code className="rounded bg-muted px-1">
                    claude_desktop_config.json
                  </code>
                  （需先安裝{" "}
                  <code className="rounded bg-muted px-1">
                    npx mcp-remote
                  </code>
                  ）
                </p>
              </TabsContent>

              <TabsContent value="vscode" className="mt-2 space-y-2">
                <pre className="rounded-md bg-muted p-3 text-xs font-mono overflow-x-auto max-h-48 whitespace-pre-wrap break-all">
                  {vscodeConfig}
                </pre>
                <p className="text-xs text-muted-foreground">
                  貼到專案的{" "}
                  <code className="rounded bg-muted px-1">.vscode/mcp.json</code>
                  ，適用於 GitHub Copilot 和 OpenAI Codex
                </p>
              </TabsContent>

              <TabsContent value="chatgpt" className="mt-2 space-y-2">
                <pre className="rounded-md bg-muted p-3 text-xs font-mono overflow-x-auto max-h-48 whitespace-pre-wrap break-all">
                  {chatgptConfig}
                </pre>
                <p className="text-xs text-muted-foreground">
                  在 ChatGPT 設定 → MCP 中新增，貼上此 JSON 設定
                </p>
              </TabsContent>
            </Tabs>

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
