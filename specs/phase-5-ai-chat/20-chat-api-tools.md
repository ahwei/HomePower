# Task #20: AI Chat — API Route + Agent Tools

## 目標

建立 AI Chat 後端，使用 Vercel AI SDK + OpenAI，定義 Agent Tools。

## 前置條件

- Task #3（ai, @ai-sdk/openai 已安裝）
- Task #7（calculateBill 邏輯）

## 產出檔案

```
src/app/api/chat/route.ts
src/features/chat/tools/query-devices.ts
src/features/chat/tools/calculate-bill.ts
src/features/chat/tools/get-grid-status.ts
src/features/chat/tools/get-weather.ts
src/features/chat/tools/compare-plans.ts
```

## 規格

### API Route (route.ts)

- `POST /api/chat`
- 使用 AI SDK `streamText()` + OpenAI GPT-4o
- System prompt：台灣家庭能源顧問，用繁體中文回答
- `maxSteps: 5`（避免無限 tool loop）
- SSE 串流回應
- 需驗證 Supabase auth（從 cookie 取 user）

### Agent Tools

| Tool          | 參數              | 說明                         |
| ------------- | ----------------- | ---------------------------- |
| queryDevices  | (none)            | 查詢當前使用者的設備列表     |
| calculateBill | kWh, planType     | 計算電費                     |
| getGridStatus | (none)            | 取得台電即時供電狀態         |
| getWeather    | location?         | 取得天氣預報                 |
| comparePlans  | kWh, usagePattern | 比較不同電價方案             |

每個 tool 使用 AI SDK `tool()` 定義，包含 description + parameters (Zod schema) + execute function。

### 網路搜尋

使用 OpenAI 內建 web search（不用 Tavily），在 system prompt 中指引 model 用 web search 回答最新電力資訊。

## 驗收標準

- [ ] `curl -X POST http://localhost:8088/api/chat -d '{"messages":[{"role":"user","content":"你好"}]}'` 收到串流回應
- [ ] 問「我的設備有哪些」→ Agent 呼叫 queryDevices tool
- [ ] 問「450度電費多少」→ Agent 呼叫 calculateBill tool
- [ ] 未登入時回傳 401
- [ ] `pnpm build` 通過
