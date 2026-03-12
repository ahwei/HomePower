"use client";

import type { UIMessage } from "ai";
import { Bot, User } from "lucide-react";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { cn } from "@/lib/utils";
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";

interface ChatMessageProps {
  message: UIMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <Message from={message.role}>
      <div className={cn("flex items-start gap-3", isUser && "flex-row-reverse")}>
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
        <MessageContent>
          {message.parts.map((part, i) => {
            if (part.type === "text") {
              if (!part.text) return null;
              return isUser ? (
                <div key={i} className="whitespace-pre-wrap">
                  {part.text}
                </div>
              ) : (
                <MessageResponse key={i}>{part.text}</MessageResponse>
              );
            }
            if (part.type?.startsWith("tool-")) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const toolPart = part as any;
              return (
                <Tool key={i}>
                  <ToolHeader
                    type={toolPart.type as "tool-getDevices"}
                    state={toolPart.state as "output-available"}
                    title={getToolTitle(toolPart.toolName)}
                  />
                  <ToolContent>
                    {toolPart.input && (
                      <ToolInput input={toolPart.input} />
                    )}
                    {(toolPart.output || toolPart.errorText) && (
                      <ToolOutput
                        output={toolPart.output}
                        errorText={toolPart.errorText}
                      />
                    )}
                  </ToolContent>
                </Tool>
              );
            }
            return null;
          })}
        </MessageContent>
      </div>
    </Message>
  );
}

function getToolTitle(toolName?: string): string {
  const map: Record<string, string> = {
    getDevices: "查詢設備清單",
    getDeviceSummary: "設備統計摘要",
    getUsageByDateRange: "查詢用電資料",
    getMonthlyUsageSummary: "月度用電摘要",
    calculateElectricityBill: "計算電費",
    getUserSettings: "查詢使用者設定",
    getEnergySavingTips: "節電建議分析",
  };
  return map[toolName ?? ""] ?? toolName ?? "工具呼叫";
}
