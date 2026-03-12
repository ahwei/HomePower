"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  MessageSquare,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getChatSessions, deleteChatSession } from "@/app/actions/chat";

interface ChatSession {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PaginatedResult {
  items: ChatSession[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function ChatHistory() {
  const router = useRouter();
  const [data, setData] = useState<PaginatedResult | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const fetchSessions = useCallback(
    async (p: number, q: string) => {
      setLoading(true);
      try {
        const result = await getChatSessions({ page: p, pageSize: 10, search: q });
        setData(result);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchSessions(page, search);
  }, [page, search, fetchSessions]);

  // Debounced search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleDelete = useCallback(
    async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!confirm("確定要刪除此對話紀錄？")) return;
      startTransition(async () => {
        await deleteChatSession(id);
        await fetchSessions(page, search);
      });
    },
    [page, search, fetchSessions]
  );

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      {/* Header: search + new chat */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="搜尋對話紀錄..."
            className="w-full rounded-lg border bg-background py-2 pl-9 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
          />
        </div>
        <Button size="sm" onClick={() => router.push("/chat/new")}>
          <Plus className="mr-1 h-4 w-4" />
          新對話
        </Button>
      </div>

      {/* List */}
      {loading && !data ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : data && data.items.length > 0 ? (
        <div className="space-y-2">
          {data.items.map((session) => (
            <div
              key={session.id}
              role="button"
              tabIndex={0}
              onClick={() => router.push(`/chat/${session.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") router.push(`/chat/${session.id}`);
              }}
              className="group flex w-full cursor-pointer items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-muted"
            >
              <MessageSquare className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{session.title}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(session.updatedAt)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={(e) => handleDelete(session.id, e)}
                disabled={isPending}
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          <MessageSquare className="mb-2 h-8 w-8" />
          <p className="font-medium">
            {search ? "找不到相關對話" : "尚無對話紀錄"}
          </p>
          <p className="mt-1 text-sm">
            {search ? "試試其他關鍵字" : "點擊「新對話」開始聊天"}
          </p>
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            共 {data.total} 筆，第 {data.page} / {data.totalPages} 頁
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
