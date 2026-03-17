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
        RT["POST /api/chat<br/>route.ts (101 行)"]
        ST["streamText()"]
        CM["convertToModelMessages()"]
        OF["onFinish callback"]
        RT --> CM --> ST
        ST --> OF
    end

    subgraph Tools["7 個 AI Tools (tools.ts, 281 行)"]
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
        RLS["authDb() wrapper<br/>RLS Transaction"]
    end

    subgraph External["外部服務"]
        OAI["OpenAI GPT"]
        PG["PostgreSQL<br/>(Supabase)"]
    end

    UC -- "HTTP Stream (SSE)" --> RT
    RT -- "驗證身份" --> AUTH
    ST -- "模型推論" --> OAI
    OAI -- "Tool Calling" --> Tools
    Tools -- "withRls()" --> RLS
    RLS -- "SQL Query" --> PG
    OF -- "存聊天記錄" --> RLS
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
    participant DB as PostgreSQL (RLS)

    U->>FE: 輸入「我上個月用了多少電？」
    FE->>API: POST /api/chat (messages + sessionId)
    API->>Auth: getUser() 驗證身份
    Auth-->>API: user object

    API->>LLM: streamText({ messages, tools })

    Note over LLM: AI 判斷需要查資料

    LLM->>Tool: getMonthlyUsageSummary({ year: 2026, month: 2 })
    Tool->>DB: authDb(userId) → SELECT with RLS
    DB-->>Tool: 用電資料
    Tool-->>LLM: { totalKwh: 350, deviceRanking: [...] }

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
        E --> F["withRls() 包裝 RLS"]
        F --> G["Drizzle ORM 查詢"]
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

## 關鍵程式碼對照

```
382 行 = 完整 AI 聊天系統

route.ts (101 行)
├── 身份驗證 (Supabase Auth)
├── streamText() 核心呼叫
│   ├── model: OpenAI GPT
│   ├── system: 繁中系統提示詞
│   ├── tools: createTools(userId)
│   └── stopWhen: stepCountIs(5) ← 防止無限 loop
├── onFinish() 聊天持久化
│   ├── 存 user 訊息
│   ├── 存 assistant 回覆
│   └── 更新 session 時間戳
└── toUIMessageStreamResponse() ← 一行搞定 SSE

tools.ts (281 行)
├── withRls wrapper ← 所有 tool 共用的 RLS 保護
├── getDevices ← 設備清單
├── getDeviceSummary ← 統計摘要 + 類別佔比
├── getUsageByDateRange ← 時間區間用電趨勢
├── getMonthlyUsageSummary ← 月度報表 + 設備排名
├── calculateElectricityBill ← 3 種電價方案計算
├── getUserSettings ← 使用者偏好設定
└── getEnergySavingTips ← 智能節電建議
```
