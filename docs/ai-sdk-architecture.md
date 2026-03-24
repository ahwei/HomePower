# AI SDK 架構與開發流程

## 整體架構

```mermaid
graph TB
    subgraph Frontend["前端 (React)"]
        UC["useChat Hook<br/>@ai-sdk/react"]
        AE["AI Elements<br/>Message / Prompt Input"]
        UC <--> AE
    end

    subgraph API["Next.js API Route"]
        RT["POST /api/chat<br/>route.ts"]
        ST["streamText()"]
        CM["convertToModelMessages()"]
        OF["onFinish callback"]
        RT --> CM --> ST
        ST --> OF
    end

    subgraph Tools["7 個 AI Tools (tools.ts)"]
        T1["getDevices<br/>查詢家電設備"]
        T2["getDeviceSummary<br/>設備統計摘要"]
        T3["getUsageByDateRange<br/>日期區間用電量"]
        T4["getMonthlyUsageSummary<br/>月度用電摘要"]
        T5["calculateElectricityBill<br/>電費計算"]
        T6["getUserSettings<br/>使用者設定"]
        T7["getEnergySavingTips<br/>節電建議"]
    end

    subgraph Security["安全層"]
        AUTH["Supabase Auth<br/>getUser()"]
        RLS["Supabase PostgREST<br/>Cookie JWT → RLS"]
    end

    subgraph External["外部服務"]
        OAI["OpenAI GPT"]
        SB["Supabase<br/>PostgREST + RPC"]
    end

    UC -- "HTTP Stream (SSE)" --> RT
    RT -- "驗證身份" --> AUTH
    ST -- "模型推論" --> OAI
    OAI -- "Tool Calling" --> Tools
    Tools -- "共用查詢模組" --> RLS
    RLS -- "PostgREST / RPC" --> SB
    OF -- "存聊天記錄" --> SB
    ST -- "toUIMessageStreamResponse()" --> UC
```

## Request 生命週期

```mermaid
sequenceDiagram
    participant U as 使用者
    participant FE as 前端 (useChat)
    participant API as /api/chat
    participant Auth as Supabase Auth
    participant LLM as OpenAI GPT
    participant Tool as AI Tool
    participant Q as 共用查詢模組
    participant DB as Supabase PostgREST

    U->>FE: 輸入「我上個月用了多少電？」
    FE->>API: POST /api/chat (messages + sessionId)
    API->>Auth: getUser() 驗證身份
    Auth-->>API: user object

    API->>LLM: streamText({ messages, tools })

    Note over LLM: AI 判斷需要查資料

    LLM->>Tool: getMonthlyUsageSummary({ year: 2026, month: 2 })
    Tool->>Q: queryMonthlyUsageSummary(supabase, userId, 2026, 2)
    Q->>DB: supabase.rpc('get_monthly_usage_summary', {...})
    DB-->>Q: 用電資料
    Q-->>Tool: { totalKwh: 350, deviceRanking: [...] }
    Tool-->>LLM: 結果

    Note over LLM: AI 判斷還需要算電費

    LLM->>Tool: calculateElectricityBill({ kwh: 350 })
    Tool-->>LLM: { totalAmount: 1280, tiers: [...] }

    Note over LLM: AI 綜合結果，產生自然語言回答

    LLM-->>API: Streaming tokens
    API-->>FE: SSE Stream (toUIMessageStreamResponse)
    FE-->>U: 即時顯示回答

    Note over API: onFinish callback 觸發
    API->>DB: 存 user message + assistant reply
    API->>DB: 更新 session updatedAt
```

## Tool Calling 資料流

```mermaid
graph LR
    subgraph Definition["Tool 定義"]
        DESC["description<br/>(AI 看這個判斷何時呼叫)"]
        ZOD["Zod inputSchema<br/>(AI 自動填入參數)"]
        EXEC["execute 函式<br/>(實際執行邏輯)"]
    end

    subgraph Flow["執行流程"]
        A["AI 收到使用者問題"] --> B["比對 7 個 tool 的 description"]
        B --> C["選擇最適合的 tool"]
        C --> D["根據 inputSchema 產生參數"]
        D --> E["呼叫 execute()"]
        E --> F["共用查詢模組"]
        F --> G["Supabase PostgREST / RPC"]
        G --> H["回傳結果給 AI"]
        H --> I{"需要更多資料？"}
        I -- "是" --> B
        I -- "否" --> J["AI 產生最終回答"]
    end

    DESC --> B
    ZOD --> D

    style A fill:#e1f5fe
    style J fill:#c8e6c9
```

## 關鍵程式碼

### route.ts — Streaming + 認證 + 持久化

```typescript
// src/app/api/chat/route.ts
import { createClient } from "@/lib/supabase/server";
import { openai } from "@ai-sdk/openai";
import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from "ai";
import { createTools } from "./tools";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { messages, sessionId }: { messages: UIMessage[]; sessionId?: string } =
    await req.json();

  const result = streamText({
    model: openai(process.env.OPENAI_MODEL ?? DEFAULT_OPENAI_MODEL),
    system: getSystemPrompt(),
    messages: await convertToModelMessages(messages),
    tools: createTools(supabase, user.id),  // 傳入 Supabase client
    stopWhen: stepCountIs(5),
    async onFinish({ text }) {
      if (!sessionId) return;
      // 用 Supabase PostgREST 存聊天記錄
      await supabase.from("chat_messages").insert({
        session_id: sessionId, role: "user", content: userText,
      });
      if (text) {
        await supabase.from("chat_messages").insert({
          session_id: sessionId, role: "assistant", content: text,
        });
      }
      await supabase.from("chat_sessions")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", sessionId);
    },
  });

  return result.toUIMessageStreamResponse();
}
```

### tools.ts — 7 個 AI Tools + 共用查詢模組

```typescript
// src/app/api/chat/tools.ts
import { tool } from "ai";
import { z } from "zod/v4";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { queryDevicesForTool, queryDeviceSummary, queryEnergySavingTips } from "@/queries/devices";
import { queryUsageByDateRange, queryMonthlyUsageSummary } from "@/queries/usage-logs";
import { queryGetUserSettings } from "@/queries/user-settings";
import { calculateBill } from "@/components/billing/calculate-bill";

export function createTools(supabase: SupabaseClient<Database>, userId: string) {
  return {
    getDevices: tool({
      description: "查詢使用者的所有家電設備",
      inputSchema: z.object({}),
      execute: () => queryDevicesForTool(supabase, userId),
    }),

    getDeviceSummary: tool({
      description: "取得設備統計摘要",
      inputSchema: z.object({}),
      execute: () => queryDeviceSummary(supabase, userId),
    }),

    getUsageByDateRange: tool({
      description: "查詢指定日期區間的每日用電量",
      inputSchema: z.object({
        startDate: z.string(),
        endDate: z.string(),
      }),
      execute: ({ startDate, endDate }) =>
        queryUsageByDateRange(supabase, userId, startDate, endDate),
    }),

    // ... getMonthlyUsageSummary, calculateElectricityBill,
    //     getUserSettings, getEnergySavingTips
  };
}
```

### 共用查詢模組 — MCP + Chat 共用

```typescript
// src/queries/devices.ts — 設備查詢
export async function queryDevicesForTool(supabase, userId) {
  const { data } = await supabase
    .from("devices")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return data.map((d) => ({
    name: d.name,
    category: CATEGORY_LABELS[d.category] ?? d.category,
    ratedPowerW: d.rated_power_w,
    dailyHours: Number(d.daily_hours),
    isActive: d.is_active,
    monthlyKwh: Math.round((d.rated_power_w * Number(d.daily_hours) * 30) / 1000),
  }));
}

// src/queries/usage-logs.ts — RPC 呼叫
export async function queryMonthlyUsageSummary(supabase, userId, year, month) {
  const { data } = await supabase.rpc("get_monthly_usage_summary", {
    p_user_id: userId, p_year: year, p_month: month,
  });
  return data; // { totalKwh, dailyAvgKwh, co2Kg, deviceRanking }
}
```

## 檔案結構對照

```
AI 聊天系統架構

route.ts
├── 身份驗證 (Supabase Auth)
├── streamText() 核心呼叫
│   ├── model: OpenAI GPT
│   ├── system: 繁中系統提示詞
│   ├── tools: createTools(supabase, userId)
│   └── stopWhen: stepCountIs(5) ← 防止無限 loop
├── onFinish() 聊天持久化（Supabase PostgREST）
│   ├── 存 user 訊息
│   ├── 存 assistant 回覆
│   └── 更新 session 時間戳
└── toUIMessageStreamResponse() ← 一行搞定 SSE

tools.ts
├── createTools(supabase, userId) ← 接收 Supabase client
├── getDevices ← queryDevicesForTool()
├── getDeviceSummary ← queryDeviceSummary()
├── getUsageByDateRange ← queryUsageByDateRange()
├── getMonthlyUsageSummary ← queryMonthlyUsageSummary()
├── calculateElectricityBill ← calculateBill()（純計算）
├── getUserSettings ← queryGetUserSettings()
└── getEnergySavingTips ← queryEnergySavingTips()

共用查詢模組（與 MCP Server 共用）：
├── src/queries/devices.ts
├── src/queries/usage-logs.ts
└── src/queries/user-settings.ts
```
