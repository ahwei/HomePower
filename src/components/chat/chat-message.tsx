"use client";

import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { UIMessage } from "ai";
import { isToolUIPart } from "ai";
import { Bot, User } from "lucide-react";
import { DeviceToolOutput } from "./device-tool-output";

interface ChatMessageProps {
  message: UIMessage;
  avatarUrl?: string;
}

/** Extract tool name from part type "tool-xxx" or from toolName property */
function extractToolName(part: { type: string; toolName?: string }): string {
  if (part.toolName) return part.toolName;
  if (part.type.startsWith("tool-")) return part.type.slice(5);
  return "";
}

export function ChatMessage({ message, avatarUrl }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <Message from={message.role}>
      <div
        className={cn("flex items-start gap-3", isUser && "flex-row-reverse")}
      >
        {isUser && avatarUrl ? (
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={avatarUrl} alt="User" />
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        ) : (
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
              isUser
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground",
            )}
          >
            {isUser ? (
              <User className="h-4 w-4" />
            ) : (
              <Bot className="h-4 w-4" />
            )}
          </div>
        )}
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
            if (isToolUIPart(part)) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const tp = part as any;
              const toolName = extractToolName(tp);
              const isDeviceList =
                toolName === "getDevices" &&
                tp.state === "output-available" &&
                Array.isArray(tp.output);
              return (
                <div key={i}>
                  <Tool>
                    <ToolHeader
                      type={tp.type as "tool-getDevices"}
                      state={tp.state as "output-available"}
                      title={getToolTitle(toolName)}
                    />
                    <ToolContent>
                      {tp.input && <ToolInput input={tp.input} />}
                      {(tp.output || tp.errorText) && (
                        <ToolOutput
                          output={tp.output}
                          errorText={tp.errorText}
                        />
                      )}
                    </ToolContent>
                  </Tool>
                  {isDeviceList && (
                    <DeviceToolOutput devices={tp.output} />
                  )}
                </div>
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
