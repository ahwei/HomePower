"use client";

import { useRef, useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { Bot } from "lucide-react";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { SuggestedQuestions } from "./suggested-questions";

export function ChatPanel() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat();

  const scrollRef = useRef<HTMLDivElement>(null);
  const isLoading = status === "streaming" || status === "submitted";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
  };

  const handleSelectQuestion = (question: string) => {
    sendMessage({ text: question });
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Bot className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold">HomePower AI 助理</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                我可以幫你查詢設備用電、分析電費、提供節電建議
              </p>
            </div>
            <SuggestedQuestions onSelect={handleSelectQuestion} />
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isLoading &&
              messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-2xl bg-muted px-4 py-2.5 text-sm">
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  </div>
                </div>
              )}
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t bg-background p-4">
        <div className="mx-auto max-w-2xl">
          <ChatInput
            input={input}
            onInputChange={setInput}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
