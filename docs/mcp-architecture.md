# MCP Server 架構與開發流程

## 整體架構

```mermaid
graph TB
    subgraph Clients["MCP Clients"]
        CD["Claude Desktop"]
        CC["Claude Code"]
        OTHER["其他 MCP Client"]
    end

    subgraph Server["HomePower MCP Server (553 行)"]
        ROUTE["POST /api/mcp<br/>Next.js Route Handler"]
        AUTH_MW["Token 認證<br/>extractBearerToken()"]
        VALIDATE["validateMcpToken()<br/>SHA-256 比對"]
        FACTORY["createMcpServer(userId)<br/>工廠模式"]
        TRANSPORT["WebStandardStreamableHTTPServerTransport<br/>無狀態模式"]
    end

    subgraph Capabilities["MCP 能力"]
        subgraph ToolsGroup["6 Tools"]
            MT1["get_devices"]
            MT2["get_device_summary"]
            MT3["calculate_bill"]
            MT4["get_usage_by_date_range"]
            MT5["get_monthly_usage_summary"]
            MT6["get_energy_saving_tips"]
        end
        subgraph Resources["2 Resources"]
            MR1["homepower://grid-status<br/>台電即時供電"]
            MR2["homepower://weather-forecast<br/>7天天氣預報"]
        end
        subgraph Prompts["3 Prompts"]
            MP1["analyze-monthly<br/>月度用電分析"]
            MP2["saving-tips<br/>節電建議"]
            MP3["compare-regions<br/>地區比較"]
        end
    end

    subgraph Data["資料來源"]
        PG["PostgreSQL<br/>(authDb + RLS)"]
        TPC["台電 Open Data API"]
        CWA["中央氣象署 API"]
    end

    Clients -- "JSON-RPC over HTTP<br/>Bearer Token" --> ROUTE
    ROUTE --> AUTH_MW --> VALIDATE
    VALIDATE -- "userId" --> FACTORY
    FACTORY --> TRANSPORT
    TRANSPORT --> Capabilities
    ToolsGroup -- "withRls()" --> PG
    MR1 --> TPC
    MR2 --> PG
    MR2 --> CWA
```

## Request 生命週期

```mermaid
sequenceDiagram
    participant C as Claude Desktop
    participant R as /api/mcp (Route)
    participant A as Token Auth
    participant DB as mcp_tokens 表
    participant S as McpServer
    participant T as MCP Tool
    participant PG as PostgreSQL (RLS)

    C->>R: POST /api/mcp<br/>Authorization: Bearer <token>
    R->>A: extractBearerToken()
    A->>DB: SHA-256 hash → 查詢 mcp_tokens
    DB-->>A: userId + token metadata

    Note over A: Token 有效且未過期

    A-->>R: userId

    R->>S: createMcpServer(userId)
    Note over S: 註冊 6 tools + 2 resources + 3 prompts

    R->>S: transport.handleRequest(request)

    Note over C,S: JSON-RPC: tools/call "get_devices"

    S->>T: execute get_devices
    T->>PG: authDb(userId) → SELECT with RLS
    PG-->>T: 使用者的設備資料
    T-->>S: textResult(devices)

    S-->>R: JSON-RPC Response
    R-->>C: HTTP 200 + JSON body
```

## MCP vs REST API 對比

```mermaid
graph LR
    subgraph REST["傳統 REST API"]
        R1["GET /api/devices"] --> R2["手動解析 JSON"]
        R2 --> R3["手動組合多個 API"]
        R3 --> R4["自己寫邏輯分析"]
        R4 --> R5["顯示結果"]
    end

    subgraph MCP["MCP 模式"]
        M1["使用者說話"] --> M2["AI 自動選 tool"]
        M2 --> M3["AI 自動組合多個 tool"]
        M3 --> M4["AI 分析 + 自然語言回答"]
    end

    style REST fill:#fff3e0
    style MCP fill:#e8f5e9
```

## Token 認證流程

```mermaid
graph TD
    A["使用者在 /settings/tokens<br/>建立 MCP Token"] --> B["Server Action 產生<br/>隨機 Token 明文"]
    B --> C["SHA-256 雜湊"]
    C --> D["Hash 存入 mcp_tokens 表<br/>（明文只顯示一次）"]

    E["Claude Desktop 發送請求<br/>Bearer: token-明文"] --> F["extractBearerToken()"]
    F --> G["SHA-256(明文)"]
    G --> H["比對 mcp_tokens 表"]
    H --> I{"匹配？"}
    I -- "是" --> J["取得 userId<br/>建立 MCP Server"]
    I -- "否" --> K["401 Unauthorized"]

    style D fill:#fff9c4
    style J fill:#c8e6c9
    style K fill:#ffcdd2
```

## 開發時 MCP vs 產品內 MCP

```mermaid
graph TB
    subgraph DevTime["A 面：開發時用 MCP"]
        DEV_CC["Claude Code"]
        DEV_CC --> S_MCP["shadcn MCP<br/>查元件範例"]
        DEV_CC --> C7["context7 MCP<br/>查最新文件"]
        DEV_CC --> FIG["Figma MCP<br/>讀設計稿切版"]

        S_MCP --> DEV_OUT["產出正確的程式碼"]
        C7 --> DEV_OUT
        FIG --> DEV_OUT
    end

    subgraph ProdTime["B 面：產品內建 MCP"]
        PROD_CD["Claude Desktop"]
        PROD_CD --> HP["HomePower MCP Server"]
        HP --> HP_T["6 Tools"]
        HP --> HP_R["2 Resources"]
        HP --> HP_P["3 Prompts"]

        HP_T --> PROD_OUT["使用者直接在 Claude<br/>裡操作 HomePower"]
        HP_R --> PROD_OUT
        HP_P --> PROD_OUT
    end

    style DevTime fill:#e3f2fd
    style ProdTime fill:#fce4ec
```

## 關鍵程式碼

### Token 認證 — mcp-auth.ts（38 行）

```typescript
// src/lib/mcp-auth.ts
import { createHash } from "crypto";
import { eq, and, isNull } from "drizzle-orm";
import { db } from "@/db";
import { mcpTokens } from "@/db/schema";

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/**
 * 驗證 MCP Bearer token，回傳 userId 或 null
 */
export async function validateMcpToken(
  rawToken: string
): Promise<string | null> {
  const hash = hashToken(rawToken);

  const [token] = await db
    .select()
    .from(mcpTokens)
    .where(
      and(eq(mcpTokens.tokenHash, hash), isNull(mcpTokens.revokedAt))
    );

  if (!token) return null;

  // 檢查過期
  if (token.expiresAt && token.expiresAt < new Date()) return null;

  // 更新 lastUsedAt（fire-and-forget）
  db.update(mcpTokens)
    .set({ lastUsedAt: new Date() })
    .where(eq(mcpTokens.id, token.id))
    .then(() => {});

  return token.userId;
}
```

### MCP Server 工廠 + 認證入口

```typescript
// src/app/api/mcp/route.ts — Helpers & Factory

function extractBearerToken(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

async function authenticateRequest(
  request: Request
): Promise<Response | string> {
  const token = extractBearerToken(request);
  if (!token) return jsonResponse({ error: "未提供 API 權杖" }, 401);

  const userId = await validateMcpToken(token);
  if (!userId)
    return jsonResponse({ error: "無效或已過期的 API 權杖" }, 401);

  return userId;
}

function createMcpServer(userId: string): McpServer {
  const server = new McpServer({
    name: "homepower",
    version: "1.0.0",
  });

  registerTools(server, userId);
  registerResources(server, userId);
  registerPrompts(server);

  return server;
}
```

### registerTools() — 6 個 MCP Tools（節錄代表性 tool）

```typescript
// src/app/api/mcp/route.ts — registerTools

function registerTools(server: McpServer, userId: string) {
  const withRls = <T>(fn: (tx: typeof db) => Promise<T>) =>
    authDb(userId, fn);

  // Tool 1: 查詢設備
  server.registerTool("get_devices", { description: "查詢使用者的所有家電設備" }, () =>
    withRls(async (tx) => {
      const rows = await tx
        .select()
        .from(devices)
        .where(eq(devices.userId, userId))
        .orderBy(desc(devices.createdAt));

      return textResult(
        rows.map((d) => ({
          name: d.name,
          category: CATEGORY_LABELS[d.category] ?? d.category,
          ratedPowerW: d.ratedPowerW,
          dailyHours: Number(d.dailyHours),
          isActive: d.isActive,
          monthlyKwh: Math.round(
            (d.ratedPowerW * Number(d.dailyHours) * 30) / 1000
          ),
        }))
      );
    })
  );

  // Tool 3: 電費計算（帶 Zod inputSchema）
  server.registerTool(
    "calculate_bill",
    {
      description: "根據用電量計算電費。支援住宅累進制、時間電價二段式、三段式",
      inputSchema: z.object({
        kwh: z.number().describe("總用電量 kWh"),
        planType: z
          .enum(["residential", "time_of_use_2", "time_of_use_3"])
          .default("residential")
          .describe("電價方案"),
        month: z
          .number()
          .min(1)
          .max(12)
          .optional()
          .describe("月份（判斷夏月），不填預設當月"),
      }),
    },
    async ({ kwh, planType, month }) => {
      const isSummer = isSummerMonth(month);
      const result = calculateBill({
        kwh,
        planType: planType as PlanType,
        isSummer,
        peakKwh: Math.round(kwh * 0.6),
        offPeakKwh: Math.round(kwh * 0.4),
        midPeakKwh: Math.round(kwh * 0.25),
      });

      return textResult({
        ...result,
        isSummer,
        note: isSummer ? "夏月費率（6-9月）" : "非夏月費率",
      });
    }
  );

  // ... 還有 get_device_summary, get_usage_by_date_range,
  //     get_monthly_usage_summary, get_energy_saving_tips
}
```

### registerResources() — 2 個外部資料源

```typescript
// src/app/api/mcp/route.ts — registerResources

function registerResources(server: McpServer, userId: string) {
  const withRls = <T>(fn: (tx: typeof db) => Promise<T>) =>
    authDb(userId, fn);

  // Resource 1: 台電即時供電
  server.registerResource(
    "grid-status",
    "homepower://grid-status",
    {
      description: "台灣電力系統即時供電狀態（台電資料）",
      mimeType: "application/json",
    },
    async () => {
      const data = await fetchGridStatus();
      return resourceResult("homepower://grid-status", data);
    }
  );

  // Resource 2: 天氣預報
  server.registerResource(
    "weather-forecast",
    "homepower://weather-forecast",
    {
      description: "7 天天氣預報與冷氣預估使用時數（中央氣象署資料）",
      mimeType: "application/json",
    },
    async () => {
      const settings = await withRls(async (tx) => {
        const [row] = await tx
          .select()
          .from(userSettings)
          .where(eq(userSettings.userId, userId));
        return row;
      });

      const location = settings?.location
        ? `${settings.location}市`
        : "高雄市";
      const data = await fetchWeatherForecast(location);
      return resourceResult("homepower://weather-forecast", data);
    }
  );
}
```

### registerPrompts() — 3 個提示模板（節錄）

```typescript
// src/app/api/mcp/route.ts — registerPrompts

function registerPrompts(server: McpServer) {
  server.registerPrompt(
    "analyze-monthly",
    {
      description: "分析指定月份的用電狀況並提供建議",
      argsSchema: {
        year: z.string().describe("年份，例如 2026"),
        month: z.string().describe("月份 1-12"),
      },
    },
    async ({ year, month }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `請分析我 ${year} 年 ${month} 月的用電狀況。

請使用以下工具取得資料：
1. get_monthly_usage_summary — 取得月度用電摘要
2. get_device_summary — 取得設備統計
3. calculate_bill — 用總 kWh 試算電費

然後請提供：
- 用電概覽（總量、日均、碳排）
- 各設備用電排名分析
- 與前月比較的趨勢（如有資料）
- 具體的節電建議`,
          },
        },
      ],
    })
  );

  // ... saving-tips, compare-regions
}
```

### Route Handler — 無狀態 HTTP 入口

```typescript
// src/app/api/mcp/route.ts — Route Handlers

async function handleMcpRequest(request: Request): Promise<Response> {
  const result = await authenticateRequest(request);
  if (result instanceof Response) return result;

  const server = createMcpServer(result);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
  });
  await server.connect(transport);

  const body = await request.clone().text();
  const response = await transport.handleRequest(request, {
    parsedBody: body ? JSON.parse(body) : undefined,
  });
  return response;
}

export async function POST(request: Request) {
  return handleMcpRequest(request);
}

export async function GET() {
  return new Response(null, { status: 405 }); // 無狀態不支援 SSE
}

export async function DELETE() {
  return new Response(null, { status: 405 });
}
```

## 檔案結構對照

```
MCP Server 完整實作 = 553 行（單一檔案）

src/app/api/mcp/route.ts
├── Helpers (50 行)
│   ├── extractBearerToken() ← 從 Header 取 Token
│   ├── jsonResponse() ← 統一錯誤回應格式
│   ├── textResult() ← Tool 回傳格式
│   ├── resourceResult() ← Resource 回傳格式
│   └── authenticateRequest() ← Token 驗證入口
│
├── MCP Server Factory (12 行)
│   └── createMcpServer(userId) ← 組裝 tools + resources + prompts
│
├── registerTools() (265 行)
│   ├── get_devices ← 設備清單
│   ├── get_device_summary ← 統計摘要
│   ├── calculate_bill ← 電費計算（Zod schema 驗證輸入）
│   ├── get_usage_by_date_range ← 用電趨勢
│   ├── get_monthly_usage_summary ← 月報表
│   └── get_energy_saving_tips ← 節電建議
│
├── registerResources() (53 行)
│   ├── homepower://grid-status ← 台電即時供電 API
│   └── homepower://weather-forecast ← 氣象署 + 使用者所在地
│
├── registerPrompts() (90 行)
│   ├── analyze-monthly ← 月度分析模板
│   ├── saving-tips ← 節電建議模板
│   └── compare-regions ← 地區比較模板
│
└── Route Handlers (40 行)
    ├── POST → handleMcpRequest() ← 主要入口
    ├── GET → 405 ← 無狀態模式不支援 SSE
    └── DELETE → 405

相關檔案：
├── src/lib/mcp-auth.ts ← SHA-256 Token 驗證
├── src/app/actions/tokens.ts ← Token CRUD Server Actions
├── src/lib/grid-status.ts ← 台電 API 抓取 + 解析
└── src/lib/weather.ts ← 氣象署 API 抓取 + 解析
```
