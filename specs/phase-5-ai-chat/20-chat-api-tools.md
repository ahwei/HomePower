# Task #20: AI Chat — API Route + Agent Tools

## 目標

建立 AI Chat 後端，使用 AI SDK (`ai`) + OpenAI provider，定義 Agent Tools。

## 參考

- AI SDK: https://ai-sdk.dev/
- AI SDK Elements: https://elements.ai-sdk.dev/

## 前置條件

- Task #3（ai, @ai-sdk/react, @ai-sdk/openai 已安裝）
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

使用 AI SDK 最新 API：

```typescript
import {
  streamText,
  convertToModelMessages,
  tool,
  stopWhen,
  stepCountIs,
  type UIMessage,
  type ToolSet,
  type InferUITools,
  type UIDataTypes,
} from "ai";

export const maxDuration = 30;

// 定義 tools（見下方 Agent Tools）
const tools = { ... } satisfies ToolSet;

// export 給前端用的型別
export type ChatTools = InferUITools<typeof tools>;
export type ChatMessage = UIMessage<never, UIDataTypes, ChatTools>;

export async function POST(req: Request) {
  // 驗證 Supabase auth（從 cookie 取 user）
  const { messages }: { messages: ChatMessage[] } = await req.json();

  const result = streamText({
    model: "openai/gpt-4o",
    system: `你是台灣家庭能源顧問，用繁體中文回答。
你可以查詢使用者的設備、計算電費、取得台電供電狀態和天氣預報。
給出具體的節電建議和電價方案推薦。`,
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}
```

### Agent Tools

使用 AI SDK `tool()` 定義，每個 tool 包含 description + inputSchema (Zod) + execute：

| Tool          | inputSchema           | 說明                         |
| ------------- | --------------------- | ---------------------------- |
| queryDevices  | (none)                | 查詢當前使用者的設備列表     |
| calculateBill | `{ kWh, planType }`   | 計算電費                     |
| getGridStatus | (none)                | 取得台電即時供電狀態         |
| getWeather    | `{ location? }`       | 取得天氣預報                 |
| comparePlans  | `{ kWh, usagePattern }` | 比較不同電價方案           |

範例 tool 定義：

```typescript
import { tool } from "ai";
import { z } from "zod/v4";

export const getWeather = tool({
  description: "取得指定地點的天氣預報",
  inputSchema: z.object({
    location: z.string().describe("縣市名稱").default("高雄"),
  }),
  execute: async ({ location }) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/weather?location=${location}`);
    return res.json();
  },
});
```

### 網路搜尋

使用 OpenAI 內建 web search（不用額外套件），在 system prompt 中指引 model 回答最新電力資訊。

## 驗收標準

- [ ] `curl -X POST http://localhost:8088/api/chat -H 'Content-Type: application/json' -d '{"messages":[{"id":"1","role":"user","parts":[{"type":"text","text":"你好"}]}]}'` 收到串流回應
- [ ] 問「我的設備有哪些」→ Agent 呼叫 queryDevices tool
- [ ] 問「450度電費多少」→ Agent 呼叫 calculateBill tool
- [ ] 未登入時回傳 401
- [ ] Tool 執行結果正確回傳給 model 繼續生成
- [ ] `pnpm build` 通過
