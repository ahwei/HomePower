import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getChatMessages } from "@/app/actions/chat";
import { ChatPanel } from "@/components/chat/chat-panel";

export default async function ChatDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let session: { title: string } | null = null;
  let initialMessages: Array<{ role: "user" | "assistant"; content: string }> = [];

  try {
    const data = await getChatMessages(id);
    session = data.session;
    initialMessages = data.messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
  } catch {
    // Session not found or unauthorized
  }

  if (!session) {
    return (
      <>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Link
            href="/chat/history"
            className="flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            歷史紀錄
          </Link>
        </header>
        <main className="flex flex-1 items-center justify-center text-muted-foreground">
          對話紀錄不存在
        </main>
      </>
    );
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Link
          href="/chat/history"
          className="flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          歷史紀錄
        </Link>
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="truncate text-lg font-semibold">{session.title}</h1>
      </header>
      <ChatPanel sessionId={id} initialMessages={initialMessages} />
    </>
  );
}
