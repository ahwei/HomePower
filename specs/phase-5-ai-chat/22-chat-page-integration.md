# Task #22: AI Chat 頁面整合

## 目標

整合 Chat 元件到 /chat 頁面。

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
│ MessageList (flex-1, overflow-y)     │
│   or SuggestedQuestions (empty)      │
│                                      │
├──────────────────────────────────────┤
│ InputComposer (sticky bottom)        │
└──────────────────────────────────────┘
```

- 全高 layout（h-full flex flex-col）
- 訊息區可捲動，輸入區固定底部

## 驗收標準

- [ ] 頁面載入顯示建議問題
- [ ] 無 stub placeholder 殘留
- [ ] 全高 layout 正確
- [ ] `pnpm build` 通過
