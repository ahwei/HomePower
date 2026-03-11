# Task #3: 安裝核心依賴套件

## 目標

安裝所有 SDD 要求但尚未安裝的依賴。

## 安裝清單

### Production Dependencies

```bash
pnpm add @reduxjs/toolkit react-redux   # RTK 狀態管理
pnpm add recharts                        # 圖表
pnpm add ai @ai-sdk/react @ai-sdk/openai  # AI SDK + React hooks + OpenAI provider
```

### AI SDK Elements（shadcn registry 安裝）

Chat UI 使用 AI SDK Elements（https://elements.ai-sdk.dev/），透過 shadcn CLI 安裝到 `@/components/ai-elements/`：

```bash
# 在 Phase 5 (Task #21) 時安裝，這裡先記錄
npx shadcn@latest add "https://elements.ai-sdk.dev/r/conversation.json"
npx shadcn@latest add "https://elements.ai-sdk.dev/r/message.json"
npx shadcn@latest add "https://elements.ai-sdk.dev/r/prompt-input.json"
npx shadcn@latest add "https://elements.ai-sdk.dev/r/suggestion.json"
npx shadcn@latest add "https://elements.ai-sdk.dev/r/reasoning.json"
npx shadcn@latest add "https://elements.ai-sdk.dev/r/tool.json"
```

### 已安裝（不需重複）

- react-hook-form, zod, @hookform/resolvers（表單驗證）
- @supabase/supabase-js, @supabase/ssr（Supabase）
- shadcn/ui 相關（button, card, input, label, etc.）
- lucide-react（圖示）
- sonner（toast）

### 已移除（不安裝）

- ~~@tanstack/react-query~~ → 改用 RTK Query
- ~~zustand~~ → 改用 Redux Toolkit slice
- ~~@tavily/ai-sdk~~ → 改用 OpenAI 內建 web search

## 驗收標準

- [ ] `pnpm install` 無錯誤
- [ ] `pnpm build` 通過
- [ ] package.json 包含 @reduxjs/toolkit, react-redux, recharts, ai, @ai-sdk/react, @ai-sdk/openai
