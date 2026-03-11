# Task #22: AI Chat 頁面整合

## 目標

整合 ChatPage 元件到 /chat 頁面。

## 前置條件

- Task #21

## 修改檔案

```
src/app/(app)/chat/page.tsx
```

## Layout

```
┌──────────────────────────────────────┐
│ Header: SidebarTrigger │ AI 諮詢     │
├──────────────────────────────────────┤
│                                      │
│ Conversation (flex-1)                │
│   ConversationContent                │
│     SuggestedQuestions (empty state)  │
│     Message × N (streaming)          │
│   ConversationScrollButton           │
│                                      │
├──────────────────────────────────────┤
│ PromptInput (sticky bottom)          │
└──────────────────────────────────────┘
```

- 全高 layout（h-full flex flex-col）
- Conversation 區可捲動，PromptInput 固定底部
- 使用 AI SDK Elements 的 Conversation 自動管理捲動

## 驗收標準

- [ ] 頁面載入顯示建議問題（SuggestedQuestions）
- [ ] 發送訊息後串流回應正確顯示
- [ ] 無 stub placeholder 殘留
- [ ] 全高 layout 正確（不會出現雙捲軸）
- [ ] `pnpm build` 通過
