"use client";

import type { UIMessage } from "ai";
import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: UIMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn("flex gap-3", isUser && "flex-row-reverse")}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        )}
      >
        {message.parts.map((part, i) => {
          if (part.type === "text") {
            return (
              <div key={i} className="whitespace-pre-wrap">
                {part.text}
              </div>
            );
          }
          if (part.type?.startsWith("tool-")) {
            if ("state" in part && (part.state === "done" || part.state === "output-available")) return null;
            return (
              <div
                key={i}
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                查詢中...
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}
