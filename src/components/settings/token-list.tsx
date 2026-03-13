"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getTokens, revokeToken } from "@/app/actions/tokens";
import { CreateTokenDialog } from "./create-token-dialog";

interface Token {
  id: string;
  name: string;
  tokenPrefix: string;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
}

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function TokenList() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchTokens = useCallback(async () => {
    try {
      const data = await getTokens();
      setTokens(data);
    } catch {
      toast.error("載入權杖失敗");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  const handleRevoke = async (id: string, name: string) => {
    if (!confirm(`確定要撤銷「${name}」嗎？此操作無法復原。`)) return;

    try {
      await revokeToken(id);
      toast.success("已撤銷權杖");
      fetchTokens();
    } catch {
      toast.error("撤銷失敗");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          API 權杖用於透過 MCP 協定連接 Claude Desktop 或其他 MCP
          客戶端，存取你的 HomePower 資料。
        </p>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          建立權杖
        </Button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-muted-foreground">載入中...</div>
      ) : tokens.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
          <Key className="h-10 w-10" />
          <p>尚未建立任何 API 權杖</p>
          <Button variant="outline" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            建立第一個權杖
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名稱</TableHead>
              <TableHead>權杖</TableHead>
              <TableHead>建立時間</TableHead>
              <TableHead>最後使用</TableHead>
              <TableHead>有效期限</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tokens.map((token) => (
              <TableRow key={token.id}>
                <TableCell className="font-medium">{token.name}</TableCell>
                <TableCell>
                  <code className="rounded bg-muted px-2 py-0.5 text-xs">
                    {token.tokenPrefix}••••••••
                  </code>
                </TableCell>
                <TableCell>{formatDate(token.createdAt)}</TableCell>
                <TableCell>{formatDate(token.lastUsedAt)}</TableCell>
                <TableCell>
                  {token.expiresAt ? (
                    new Date(token.expiresAt) < new Date() ? (
                      <Badge variant="destructive">已過期</Badge>
                    ) : (
                      formatDate(token.expiresAt)
                    )
                  ) : (
                    <Badge variant="secondary">永久</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRevoke(token.id, token.name)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <CreateTokenDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={fetchTokens}
      />
    </div>
  );
}
