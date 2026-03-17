"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { Bot } from "lucide-react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Suggestions,
  Suggestion,
} from "@/components/ai-elements/suggestion";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { ChatMessage } from "./chat-message";
import {
  createChatSession,
  updateSessionTitle,
} from "@/actions/chat";

const SUGGESTIONS = [
  "我有幾台設備？每月總共用多少電？",
  "哪台設備最耗電？有什麼節電建議？",
  "幫我算上個月的電費",
  "比較夏天和冬天的用電差異",
  "用時間電價方案會比較省嗎？",
  "這個月的每日用電趨勢如何？",
];

interface ChatPanelProps {
  sessionId?: string;
  initialMessages?: Array<{ role: "user" | "assistant"; content: string }>;
  avatarUrl?: string;
}

export function ChatPanel({ sessionId: initialSessionId, initialMessages, avatarUrl }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const sessionIdRef = useRef<string | undefined>(initialSessionId);
  const titleSetRef = useRef(!!initialSessionId);

  const { messages, sendMessage, status, stop } = useChat({
    ...(initialMessages
      ? {
          messages: initialMessages.map((m, i) => ({
            id: `init-${i}`,
            role: m.role as "user" | "assistant",
            parts: [{ type: "text" as const, text: m.content }],
          })),
        }
      : {}),
  });

  // Create session on first user message
  const ensureSession = useCallback(async () => {
    if (!sessionIdRef.current) {
      const session = await createChatSession();
      sessionIdRef.current = session.id;
    }
    return sessionIdRef.current;
  }, []);

  // Auto-set title from first user message
  useEffect(() => {
    if (titleSetRef.current) return;
    const firstUser = messages.find((m) => m.role === "user");
    if (firstUser && sessionIdRef.current) {
      const text = firstUser.parts
        ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
        .map((p) => p.text)
        .join("");
      if (text) {
        titleSetRef.current = true;
        updateSessionTitle(sessionIdRef.current, text);
      }
    }
  }, [messages]);

  const handleSend = useCallback(
    async (question: string) => {
      const sid = await ensureSession();
      sendMessage(
        { text: question },
        { body: { sessionId: sid } }
      );
    },
    [ensureSession, sendMessage]
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <Conversation className="flex-1">
        <ConversationContent className="mx-auto max-w-2xl">
          {messages.length === 0 ? (
            <ConversationEmptyState
              icon={<Bot className="h-8 w-8" />}
              title="HomePower AI 助理"
              description="我可以幫你查詢設備用電、分析電費、提供節電建議"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Bot className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <h2 className="text-lg font-semibold">HomePower AI 助理</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  我可以幫你查詢設備用電、分析電費、提供節電建議
                </p>
              </div>
              <Suggestions className="mt-4 justify-center flex-wrap">
                {SUGGESTIONS.map((q) => (
                  <Suggestion
                    key={q}
                    suggestion={q}
                    onClick={handleSend}
                  />
                ))}
              </Suggestions>
            </ConversationEmptyState>
          ) : (
            messages.map((message) => (
              <ChatMessage key={message.id} message={message} avatarUrl={avatarUrl} />
            ))
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {/* Input area */}
      <div className="border-t bg-background p-4">
        <div className="mx-auto max-w-2xl">
          <PromptInput
            onSubmit={async ({ text }) => {
              if (text.trim()) {
                await handleSend(text);
                setInput("");
              }
            }}
          >
            <PromptInputTextarea
              placeholder="詢問用電相關問題..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <PromptInputFooter>
              <div />
              <PromptInputSubmit status={status} onStop={stop} />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}
