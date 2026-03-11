# Task #3: 安裝核心依賴套件

## 目標

安裝所有 SDD 要求但尚未安裝的依賴。

## 安裝清單

### Production Dependencies

```bash
pnpm add @reduxjs/toolkit react-redux   # RTK 狀態管理
pnpm add recharts                        # 圖表
pnpm add ai @ai-sdk/openai              # Vercel AI SDK + OpenAI provider
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
- [ ] package.json 包含 @reduxjs/toolkit, react-redux, recharts, ai, @ai-sdk/openai
