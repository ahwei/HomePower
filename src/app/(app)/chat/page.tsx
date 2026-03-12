import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { History } from "lucide-react";
import { ChatPanel } from "@/components/chat/chat-panel";

export default function ChatPage() {
  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">AI 諮詢</h1>
        <div className="ml-auto">
          <Link
            href="/chat/history"
            className="flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <History className="mr-1 h-4 w-4" />
            歷史紀錄
          </Link>
        </div>
      </header>
      <ChatPanel />
    </>
  );
}
