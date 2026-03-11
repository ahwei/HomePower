# Task #21: AI Chat — 對話 UI 元件

## 目標

建立 AI 對話介面，支援串流顯示與建議問題。

## 前置條件

- Task #20（/api/chat route）

## 產出檔案

```
src/features/chat/components/chat-page.tsx
src/features/chat/components/message-list.tsx
src/features/chat/components/suggested-questions.tsx
```

## 規格

### chat-page.tsx

- `"use client"`
- 使用 AI SDK `useChat()` hook
- 連接 `/api/chat` endpoint
- 包含：MessageList + InputComposer + SuggestedQuestions

### message-list.tsx

- 訊息列表，區分 user / assistant
- User message: 靠右，primary 色
- Assistant message: 靠左，支援 Markdown 渲染
- 串流中顯示打字動畫（cursor blink）
- 自動捲動到底部
- data-testid: `chat-message-{index}`

### 輸入區

- Textarea + 送出按鈕
- Enter 送出（Shift+Enter 換行）
- 串流中顯示 Stop 按鈕（取消串流）
- `aria-label="輸入問題"`
- data-testid: `chat-input`

### suggested-questions.tsx

- 對話為空時顯示建議問題
- 預設問題：
  - 「我家上個月用了 450 度，電費多少？」
  - 「有沒有更省的電價方案？」
  - 「現在台電供電狀況如何？」
  - 「今天適合開冷氣嗎？」
- 點擊後自動送出該問題
- data-testid: `suggested-question-{i}`

## 驗收標準

- [ ] 輸入問題後收到串流回應
- [ ] Assistant 回覆支援 Markdown（粗體、列表、code block）
- [ ] 串流中可點 Stop 取消（TC-08）
- [ ] 空對話顯示建議問題，點擊後送出
- [ ] 自動捲動到最新訊息
- [ ] `pnpm build` 通過
