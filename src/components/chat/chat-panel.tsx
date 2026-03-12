"use client";

import { useState } from "react";
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

const SUGGESTIONS = [
  "我有幾台設備？每月總共用多少電？",
  "哪台設備最耗電？有什麼節電建議？",
  "幫我算上個月的電費",
  "比較夏天和冬天的用電差異",
  "用時間電價方案會比較省嗎？",
  "這個月的每日用電趨勢如何？",
];

export function ChatPanel() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, stop } = useChat();

  const isLoading = status === "streaming" || status === "submitted";

  const handleSend = (question: string) => {
    sendMessage({ text: question });
  };

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
              <ChatMessage key={message.id} message={message} />
            ))
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {/* Input area */}
      <div className="border-t bg-background p-4">
        <div className="mx-auto max-w-2xl">
          <PromptInput
            onSubmit={({ text }) => {
              if (text.trim()) {
                sendMessage({ text });
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
              <PromptInputSubmit
                status={status}
                onStop={stop}
              />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}
