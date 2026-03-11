# Task #21: AI Chat — 對話 UI 元件（AI SDK Elements）

## 目標

使用 AI SDK Elements 建立 AI 對話介面，搭配 AI SDK `useChat` hook。

## 參考

- AI SDK Elements: https://elements.ai-sdk.dev/
- `useChat`: https://ai-sdk.dev/docs/ai-sdk-ui/chatbot

## 前置條件

- Task #20（/api/chat route + ChatTools 型別）

## 安裝 AI SDK Elements

透過 shadcn CLI 從 elements registry 安裝：

```bash
npx shadcn@latest add "https://elements.ai-sdk.dev/r/conversation.json"
npx shadcn@latest add "https://elements.ai-sdk.dev/r/message.json"
npx shadcn@latest add "https://elements.ai-sdk.dev/r/prompt-input.json"
npx shadcn@latest add "https://elements.ai-sdk.dev/r/suggestion.json"
npx shadcn@latest add "https://elements.ai-sdk.dev/r/reasoning.json"
npx shadcn@latest add "https://elements.ai-sdk.dev/r/tool.json"
```

元件會安裝到 `src/components/ai-elements/` 或 shadcn 設定的路徑。

## 產出檔案

```
src/features/chat/components/chat-page.tsx
src/features/chat/components/suggested-questions.tsx
```

> Message, Conversation, PromptInput 等由 AI SDK Elements 提供，不需自己寫。

## 規格

### chat-page.tsx

使用 AI SDK `useChat` hook + Elements 元件組合：

```typescript
"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { PromptInput } from "@/components/ai-elements/prompt-input";
import type { ChatTools, ChatMessage } from "@/app/api/chat/route";

export function ChatPage() {
  const { messages, sendMessage, status, stop } = useChat<ChatMessage>({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  return (
    <div className="flex h-full flex-col">
      <Conversation>
        <ConversationContent>
          {messages.length === 0 && <SuggestedQuestions onSelect={...} />}
          {messages.map((message) => (
            <Message from={message.role} key={message.id}>
              <MessageContent>
                {/* render message.parts: text, tool invocations, reasoning */}
              </MessageContent>
            </Message>
          ))}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <PromptInput onSubmit={handleSubmit} />
    </div>
  );
}
```

### Message 渲染

使用 `message.parts` 迭代渲染不同類型：

| Part Type        | 渲染方式                              |
| ---------------- | ------------------------------------- |
| `text`           | Markdown 渲染（Message 內建支援）     |
| `tool-*`         | 使用 AI SDK Elements `<Tool>` 元件    |
| `reasoning`      | 使用 `<Reasoning>` 元件（可折疊）     |

### suggested-questions.tsx

- 對話為空時顯示
- 使用 AI SDK Elements `<Suggestion>` 元件或自訂按鈕
- 預設問題：
  - 「我家上個月用了 450 度，電費多少？」
  - 「有沒有更省的電價方案？」
  - 「現在台電供電狀況如何？」
  - 「今天適合開冷氣嗎？」
- 點擊後呼叫 `sendMessage()`

### 功能需求

- Enter 送出 / Shift+Enter 換行（PromptInput 內建）
- 串流中顯示 Stop 按鈕 → 呼叫 `stop()`
- 自動捲動到最新訊息（Conversation 內建）
- 支援 Markdown 渲染（粗體、列表、code block）

### data-testid

- `chat-input` — PromptInput textarea
- `chat-message-{index}` — 每則訊息
- `suggested-question-{i}` — 建議問題按鈕

## 驗收標準

- [ ] AI SDK Elements 元件安裝成功（Conversation, Message, PromptInput, Suggestion）
- [ ] 輸入問題後收到串流回應，逐字顯示
- [ ] Assistant 回覆支援 Markdown
- [ ] Tool 呼叫結果正確顯示
- [ ] 串流中可點 Stop 取消（TC-08）
- [ ] 空對話顯示建議問題，點擊後送出
- [ ] 自動捲動到最新訊息
- [ ] `pnpm build` 通過
