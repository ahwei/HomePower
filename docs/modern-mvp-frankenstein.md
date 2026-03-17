# 現代快速開發 MVP 的縫合怪：HomePower 開發實錄

## Agenda

| #   | 段落                    |
| --- | ----------------------- |
| 1   | 開場：什麼是「縫合怪」  |
| 2   | HomePower 產品 Demo     |
| 3   | 縫合的每一針 — 技術選型 |
| 4   | Claude Code 開發加速器  |
| 5   | MCP 雙面體驗            |
| 6   | Vercel AI SDK 深度剖析  |
| 7   | 踩坑紀錄與 MVP 心法     |
| 8   | Q&A                     |

## 1. 開場：什麼是「縫合怪」

### 先說結論

「縫合怪」不是罵人的話，是一種**開發策略**。

想像你要蓋一棟房子。傳統做法是自己燒磚、自己做水泥、自己拉電線。現代做法？去 IKEA 買模組化家具，請水電師傅接管線，用智能家居系統串起來 — 你只負責設計跟組裝。

軟體開發也一樣。2026 年的我們有大量成熟的 SaaS 和開源工具，每個都像一個「器官」，你要做的就是當那個「縫合醫生」，把它們拼接成一個活生生的產品。

### 為什麼這種模式特別適合 MVP？

**1. 速度壓倒一切**

MVP 的核心目的是**驗證想法**，不是寫完美的程式碼。你花三個月自建 auth 系統，結果發現根本沒人需要這個產品 — 那三個月就白費了。縫合怪模式讓你在幾天內就能把產品放到使用者面前，快速拿到回饋。

**2. 站在巨人的肩膀上**

每個你選用的工具背後，都有一整個團隊在維護。Supabase 的 Auth 有專門的資安團隊在處理漏洞、shadcn/ui 有社群在持續優化元件、Vercel AI SDK 有團隊在跟進 OpenAI 的最新 API。你一個人，但享受的是幾十個團隊的成果。

**3. 成本趨近於零**

這些工具幾乎都有慷慨的免費額度。Supabase 免費方案包含 50,000 月活用戶、500 MB 資料庫、1 GB Storage。Vercel 免費方案足以應付初期流量。MVP 階段你可能一毛錢都不用花。

**4. 隨時可以「拆掉重縫」**

縫合怪不代表技術債。每個工具都是獨立的模組，不滿意隨時可以換。Auth 從 Supabase 換成 Clerk？換一層就好。ORM 從 Prisma 換成 Drizzle？我就真的換過，而且只花了半天。這比重構一個自建的 monolith 輕鬆太多。

**5. AI 加持下效率再翻倍**

2026 年做 MVP 還有一個以前沒有的優勢：**AI coding assistant**。Claude Code 搭配這些成熟工具，等於你有一個熟悉所有框架文件的 pair programmer。工具越標準、文件越齊全，AI 幫你寫 code 的品質就越高。自建的東西 AI 反而幫不了你。

### 傳統開發 vs 現代拼接法

| 項目     | 傳統開發                       | 縫合怪                        |
| -------- | ------------------------------ | ----------------------------- |
| Auth     | 自建 JWT + session 管理        | Supabase Auth（一行搞定）     |
| Database | 自架 PostgreSQL + 寫 migration | Supabase DB + Drizzle ORM     |
| Storage  | 自建 S3 + CDN                  | Supabase Storage              |
| UI 元件  | 從零刻 or 買 UI kit            | shadcn/ui（複製貼上即擁有）   |
| AI 聊天  | 自串 OpenAI + 處理 streaming   | Vercel AI SDK（382 行全搞定） |
| 部署     | 設定 Docker + CI/CD            | Vercel（git push 就部署）     |

### HomePower 的成績單

- **不到一週** — 從零到完整產品
- **一人完成** — 但開發體驗像有一整個團隊
- **幾乎零成本** — 全部工具都在免費額度內

---

## 2. HomePower 產品 Demo

### HomePower 是什麼？

一個**智慧家庭用電管理平台**。讓你知道家裡的電都花在哪，每月電費會是多少，還有 AI 幫你分析怎麼省電。

### Demo 流程

**Dashboard**

- 台電即時供電狀態（從台電 Open Data 即時抓取）
- 中央氣象署天氣預報（搭配冷氣使用建議）
- 用電趨勢圖表（Recharts）

**設備管理**

- 11 種預設家電類別（冷氣、冰箱、洗衣機...）
- 自訂設備 + 圖片上傳
- 自動計算月估用電量

**電費計算**

- 住宅累進制
- 時間電價二段式
- 時間電價三段式
- 夏月 / 非夏月自動判斷

**AI 聊天**（重頭戲！）

- 「我家上個月用了多少電？」→ AI 自動呼叫 tool 查資料
- 「幫我算電費」→ AI 填入參數、呼叫計算工具
- 「怎麼省電？」→ AI 分析你的設備，給個人化建議
- 聊天記錄自動存到 PostgreSQL

**MCP Token 管理**

- 產生 API Token，讓 Claude Desktop 直接存取你的用電資料
- SHA-256 雜湊存儲，安全第一

---

## 3. 縫合的每一針 — 技術選型

### 架構全景

```
使用者 → Next.js 16 (App Router)
              ├── Supabase Auth（登入驗證）
              ├── Supabase Storage（圖片儲存）
              ├── PostgreSQL + Drizzle ORM（資料庫）
              ├── Vercel AI SDK + OpenAI（AI 聊天）
              ├── MCP Server（外部 AI 存取）
              └── shadcn/ui（UI 元件）
```

### 技術清單

| 類別      | 工具                        | 為什麼選它                                   |
| --------- | --------------------------- | -------------------------------------------- |
| Framework | Next.js 16 + React 19       | App Router + Server Components，前後端一把罩 |
| 語言      | TypeScript strict           | 型別安全，AI 也比較好幫你寫 code             |
| 樣式      | Tailwind CSS v4 + shadcn/ui | 零設計稿也能做出好看的 UI                    |
| 後端服務  | Supabase                    | Auth + DB + Storage 一站搞定                 |
| ORM       | Drizzle ORM                 | 輕量、型別安全、支援 RLS                     |
| 狀態管理  | Redux Toolkit               | 不是最潮但最穩                               |
| 圖表      | Recharts                    | React 生態圈最成熟的圖表庫                   |
| 表單      | react-hook-form + Zod v4    | 驗證邏輯跟 AI SDK tool schema 共用           |
| AI        | Vercel AI SDK + OpenAI      | Streaming + Tool Calling 一氣呵成            |
| 部署      | Vercel                      | Git push 即部署                              |

### 重點一：Supabase 一站式後端 + RLS 安全機制

Supabase 是這隻縫合怪的「骨架」。一個服務搞定三件事：

1. **Auth** — Email/Password 登入，不用自己管 session
2. **Database** — 託管的 PostgreSQL，支援 Row Level Security
3. **Storage** — 圖片上傳 + CDN，RLS 保護使用者資料夾

Supabase 後端原生就支援 **RLS（Row Level Security）**。什麼意思？就是你可以在資料庫層面定義「誰能看到哪些資料」，不用在每個 query 手動加 `WHERE userId = ?`。

如果你用 Supabase 官方的 JavaScript Client，RLS 是**自動生效**的：

```typescript
// Supabase 官方 Client — RLS 自動帶入 JWT
const supabase = createClient(url, anonKey);
const { data } = await supabase
  .from("devices")
  .select("*"); // 自動只回傳當前使用者的資料，不需要 WHERE
```

Supabase Client 會把使用者的 JWT token 帶給 PostgreSQL，資料庫根據 RLS policy 自動過濾。使用者 A 永遠看不到使用者 B 的資料。**零行安全程式碼，資料庫幫你搞定。**

但我這個專案用的是 **Drizzle ORM**（為了型別安全和更靈活的查詢），Drizzle 直接連 PostgreSQL，繞過了 Supabase Client，所以 RLS 不會自動生效。怎麼辦？自己寫一個 38 行的 wrapper：

```typescript
// src/db/index.ts — 自製 RLS wrapper
export async function authDb<T>(
  userId: string,
  fn: (tx: typeof db) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    // 手動模擬 Supabase Client 的行為：
    // 告訴 PostgreSQL「我是 authenticated 角色」
    await tx.execute(sql`SELECT set_config('role', 'authenticated', true)`);
    // 注入 JWT claims，讓 auth.uid() 回傳正確的 userId
    await tx.execute(
      sql`SELECT set_config('request.jwt.claims', ${JSON.stringify({ sub: userId })}, true)`,
    );
    // 現在所有查詢都會經過 RLS 過濾，跟用 Supabase Client 一樣安全
    return fn(tx as unknown as typeof db);
  });
}
```

本質上就是在每個 transaction 開始前，手動做了 Supabase Client 自動做的事：設定 PostgreSQL 的 `role` 和 `request.jwt.claims`，讓 RLS policy 能正確判斷「這個查詢是誰發的」。

整個專案裡，只要涉及使用者資料的查詢，都用 `authDb()` 包一層。如果哪天想換回 Supabase Client，直接把 `authDb()` 的查詢改成 `supabase.from(...)` 就好，RLS policy 不用動。

**補充：已經用 Auth0 的團隊怎麼辦？**

不用遷移！Supabase 支援 **Third-party Auth**，可以直接認 Auth0 發的 JWT。Auth0 負責登入驗證，Supabase 負責資料庫 + RLS 授權，各司其職。設定方式是在 Supabase Dashboard 加入 Auth0 作為 third-party provider，再在 Auth0 端用 Action 把 `role: 'authenticated'` 塞進 JWT custom claim 就完成了。

參考文件：
- [Supabase 官方 Auth0 整合指南](https://supabase.com/docs/guides/auth/third-party/auth0)
- [Auth0 Blog: Next.js + Auth0 + Supabase 實戰](https://auth0.com/blog/using-nextjs-and-auth0-with-supabase/)

### 重點三：shadcn/ui + AI Elements — 不只是元件庫

shadcn/ui 的哲學是「你擁有程式碼」。不是 npm install 一個黑箱，而是把元件原始碼直接放到你的專案裡。你可以自由修改、客製化，不受版本升級綁架。

而 Vercel 官方在 shadcn/ui 的基礎上，推出了 **AI Elements**（[elements.ai-sdk.dev](https://elements.ai-sdk.dev/)）— 一套專為 AI 原生應用設計的元件庫。它建立在 shadcn/ui 的慣例之上，你現有的主題和設置會自動套用。

AI Elements 涵蓋的範圍非常廣：

| 分類 | 元件數量 | 代表元件 |
| ---- | -------- | -------- |
| 聊天機器人 | 13+ | Message、Prompt Input、Suggestion、Chain of Thought、Reasoning |
| 程式碼 | 13+ | Code Block、File Tree、Terminal、JSX Preview、Sandbox |
| 語音 | 6 | Speech Input、Audio Player、Transcription |
| 工作流程 | 7 | Canvas、Node、Edge、Controls |

HomePower 用到的主要是聊天相關元件：

- `Message` — 訊息氣泡（支援 Markdown 渲染）
- `Prompt Input` — 輸入框（支援附件、多行）
- `Suggestion` — 建議提問按鈕

這些元件跟 AI SDK 的 `useChat` hook 深度整合，內建 streaming 狀態管理和型別安全。搭配起來，幾乎零設定就能做出 ChatGPT 等級的聊天介面。

> 如果你要做 AI 聊天功能，不用自己刻 UI。AI Elements + useChat = 直接起飛。

---

## 4. Claude Code — 開發加速器

### CLAUDE.md：AI 的使用說明書

整個專案的核心祕密是一個檔案：`CLAUDE.md`。

這個檔案告訴 Claude Code：

- 這個專案用什麼技術棧
- 目錄結構長什麼樣
- 關鍵檔案在哪裡
- 有哪些指令可以跑
- UI 文字要用繁體中文

有了這個檔案，Claude Code 每次進入專案都能「記住」所有上下文，不用每次都重新解釋。

```markdown
# CLAUDE.md 節錄

## Tech Stack

- **Next.js 16** (App Router, React 19, Turbopack)
- **TypeScript** strict mode
- **Tailwind CSS v4** + **shadcn/ui**
- **Supabase** — Auth + Storage
- **Drizzle ORM** + RLS enforced via `authDb()`

## Key Files

- `src/db/index.ts` — Drizzle DB singleton + RLS wrapper
- `src/app/api/chat/route.ts` — AI SDK streaming 核心
- `src/app/api/mcp/route.ts` — MCP server 完整實作

## Language

UI text is in **Traditional Chinese (zh-TW)**.
```

### Skills：Claude Code 的「技能包」

Claude Code 可以載入 Skills，就像遊戲角色裝備技能一樣：

| Skill                         | 用途                              |
| ----------------------------- | --------------------------------- |
| `shadcn-ui`                   | 產生 shadcn/ui 元件時遵循最佳實踐 |
| `ai-sdk`                      | 使用 Vercel AI SDK 時參考最新 API |
| `coding-standards`            | 統一 TypeScript / React 編碼風格  |
| `vercel-react-best-practices` | React 效能優化                    |

### 開發用 MCP Servers

Claude Code 還能連接 MCP Server 來增強能力：

| MCP Server       | 用途                                                          |
| ---------------- | ------------------------------------------------------------- |
| **shadcn MCP**   | 查詢 shadcn/ui 元件的最新用法和範例                           |
| **context7 MCP** | 查第三方函式庫的最新文件（不用怕 AI 用到過時 API）            |
| **Figma MCP**    | 讀取 Figma 設計稿，讓 AI 直接根據設計產出對應的前端元件程式碼 |

HomePower 這個專案沒有設計師、沒有 Figma 設計稿，所以沒用到 Figma MCP。但如果你的團隊有設計師出圖，Figma MCP 會非常強大 — Claude Code 可以直接「看」Figma 上的元件，理解間距、顏色、排版，然後產出對應的 React + Tailwind 程式碼。等於設計師丟圖，AI 直接切版，工程師只需要 review。

`context7` 特別實用，值得單獨拿出來講。

### context7 MCP — 解決 AI 最大痛點

AI 寫 code 最常見的問題是什麼？**用到過時的 API。**

Claude 的訓練資料有截止日期，但框架和函式庫每幾個月就更新一次。比如：

- Vercel AI SDK 4.x 的 `streamText()` API 跟 3.x 完全不同
- Next.js 16 的 `proxy.ts` 取代了以前的 `middleware.ts`
- shadcn/ui 的 Tailwind v4 整合方式跟 v3 差很多
- Zod v4 的 import 從 `zod` 變成 `zod/v4`

如果 AI 不知道這些變更，它會很有自信地寫出「看起來對但跑不了」的 code。

**context7 MCP 的解法**：它能即時去查函式庫的最新文件和範例程式碼，然後注入到 AI 的上下文裡。

實際使用流程：

1. Claude Code 要幫你寫 AI SDK 的 streaming 邏輯
2. 它先透過 context7 查詢 `vercel/ai` 的最新文件
3. 拿到最新的 `streamText()` 用法和參數
4. 再根據最新文件寫出正確的 code

這在開發 HomePower 時省了我大量的 debug 時間。以前的流程是：AI 寫 code → 跑不了 → 我去查文件 → 貼回給 AI → 再改一輪。現在 context7 讓 AI 自己就能查到最新文件，**一次就寫對**。

> 如果你只裝一個 MCP Server 給 Claude Code，裝 context7。

---

## 5. MCP 雙面體驗

### MCP 是什麼？

**Model Context Protocol** — 你可以把它想成「AI 的 USB-C」。

USB-C 讓你的手機可以接上任何周邊設備（螢幕、硬碟、鍵盤）。MCP 讓 AI 可以接上任何資料來源和工具（資料庫、API、檔案系統）。

### 我的 MCP 雙面體驗

**A 面：開發時用別人的 MCP**

- shadcn MCP — 查詢元件的最新範例
- context7 MCP — 查函式庫最新文件

**B 面：在產品裡自建 MCP Server**

- 讓 Claude Desktop 可以直接存取 HomePower 的資料
- 使用者不用開網頁，直接在 Claude 裡問「我上個月用了多少電？」

### HomePower MCP Server 規格

| 項目      | 內容                                    |
| --------- | --------------------------------------- |
| 程式碼    | **553 行**（單一檔案）                  |
| Tools     | 6 個（設備查詢、用電統計、電費計算...） |
| Resources | 2 個（台電供電狀態、天氣預報）          |
| Prompts   | 3 個（月度分析、節電建議、地區比較）    |
| 認證      | SHA-256 hashed Bearer Token             |
| 傳輸      | Streamable HTTP（無狀態模式）           |

### MCP Server 核心架構

```typescript
// src/app/api/mcp/route.ts — 工廠模式
function createMcpServer(userId: string): McpServer {
  const server = new McpServer({
    name: "homepower",
    version: "1.0.0",
  });

  registerTools(server, userId); // 6 個工具
  registerResources(server, userId); // 2 個資源
  registerPrompts(server); // 3 個提示

  return server;
}
```

每個 request 進來都建一個新的 MCP Server 實例（無狀態），驗證 token 後注入 userId，所有操作都經過 `authDb()` 確保 RLS 安全。

### Claude Desktop 整合

使用者只需要：

1. 在 HomePower 產生一組 MCP Token
2. 在 Claude Desktop 設定 MCP 連線
3. 直接對 Claude 說：「分析我這個月的用電」

Claude 會自動呼叫 HomePower 的 MCP tools 取得資料，然後給出分析報告。

---

## 6. Vercel AI SDK 深度剖析

這是今天的重頭戲。**382 行程式碼**搞定一個完整的 AI 聊天系統。

### 架構概覽

```
前端 (useChat hook)
  ↕ HTTP Stream (SSE)
後端 (streamText)
  ↕ Tool Calling
OpenAI GPT + 7 個自訂 Tools
  ↕ RLS Transaction
PostgreSQL (Supabase)
```

### 後端核心：route.ts（101 行）

整個 AI 聊天的後端只有一個檔案，101 行：

```typescript
// src/app/api/chat/route.ts
import { streamText, convertToModelMessages, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { createTools } from "./tools";

export async function POST(req: Request) {
  // 1. 驗證身份
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  // 2. 解析訊息
  const { messages, sessionId } = await req.json();

  // 3. 呼叫 AI（就這麼簡單！）
  const result = streamText({
    model: openai(process.env.OPENAI_MODEL ?? "gpt-4o-mini"),
    system: getSystemPrompt(),
    messages: await convertToModelMessages(messages),
    tools: createTools(user.id), // 7 個工具
    stopWhen: stepCountIs(5), // 最多 5 輪 tool calling

    // 4. 聊天持久化
    async onFinish({ text }) {
      if (!sessionId) return;
      await authDb(user.id, async (tx) => {
        // 存 user 訊息 + assistant 回覆
        // 更新 session 時間戳
      });
    },
  });

  // 5. 回傳 streaming response（一行搞定！）
  return result.toUIMessageStreamResponse();
}
```

重點觀察：

1. **`streamText()`** — AI SDK 的核心函式，處理所有 streaming 邏輯
2. **`toUIMessageStreamResponse()`** — 自動把 AI 回應轉成 SSE stream，前端 `useChat` 直接接
3. **`stopWhen: stepCountIs(5)`** — 防止 AI 無限 loop 呼叫 tools
4. **`onFinish`** — streaming 結束後的 callback，用來存聊天記錄

### Tool Calling：讓 AI 長出手腳

這是 AI SDK 最強大的功能。你用 Zod schema 定義工具，AI 會**自動判斷什麼時候該呼叫哪個工具、自動填入參數**。

```typescript
// src/app/api/chat/tools.ts
export function createTools(userId: string) {
  const withRls = <T>(fn: (tx: typeof db) => Promise<T>) => authDb(userId, fn);

  return {
    // Tool 1: 查詢設備
    getDevices: tool({
      description: "查詢使用者的所有家電設備",
      inputSchema: z.object({}),
      execute: () =>
        withRls(async (tx) => {
          const rows = await tx
            .select()
            .from(devices)
            .where(eq(devices.userId, userId));
          return rows.map((d) => ({
            name: d.name,
            category: CATEGORY_LABELS[d.category],
            ratedPowerW: d.ratedPowerW,
            monthlyKwh: Math.round(
              (d.ratedPowerW * Number(d.dailyHours) * 30) / 1000,
            ),
          }));
        }),
    }),

    // Tool 2: 電費計算
    calculateElectricityBill: tool({
      description: "根據用電量計算電費",
      inputSchema: z.object({
        kwh: z.number().describe("總用電量 kWh"),
        planType: z
          .enum(["residential", "time_of_use_2", "time_of_use_3"])
          .default("residential"),
        month: z
          .number()
          .min(1)
          .max(12)
          .optional()
          .describe("月份（判斷夏月）"),
      }),
      execute: async ({ kwh, planType, month }) => {
        const result = calculateBill({
          kwh,
          planType,
          isSummer: isSummerMonth(month),
        });
        return {
          ...result,
          note: isSummer ? "夏月費率（6-9月）" : "非夏月費率",
        };
      },
    }),

    // ... 還有 5 個 tools
  };
}
```

### 7 個 Tools 一覽

| Tool                       | 功能                         | 輸入參數             |
| -------------------------- | ---------------------------- | -------------------- |
| `getDevices`               | 查詢所有家電設備             | 無                   |
| `getDeviceSummary`         | 設備統計摘要 + 各類別佔比    | 無                   |
| `getUsageByDateRange`      | 指定日期區間的每日用電量     | startDate, endDate   |
| `getMonthlyUsageSummary`   | 月度用電摘要 + 設備排名      | year, month          |
| `calculateElectricityBill` | 計算電費（3 種方案）         | kwh, planType, month |
| `getUserSettings`          | 使用者設定（電價方案、地區） | 無                   |
| `getEnergySavingTips`      | 個人化節電建議               | 無                   |

### Tool Calling 的魔法

當使用者問「我上個月用了多少電？電費多少？」，AI 會自動：

1. 呼叫 `getMonthlyUsageSummary({ year: 2026, month: 2 })` — 抓用電資料
2. 呼叫 `calculateElectricityBill({ kwh: 350, planType: "residential", month: 2 })` — 算電費
3. 綜合兩個結果，用自然語言回答使用者

你**不需要寫任何路由邏輯**來判斷使用者意圖。AI 看 `description` 和 `inputSchema` 就知道該怎麼做。

### 安全性：withRls 模式

注意每個 tool 的 `execute` 都用 `withRls()` 包起來：

```typescript
const withRls = <T>(fn: (tx: typeof db) => Promise<T>) => authDb(userId, fn);
```

這確保即使 AI 嘗試查詢其他使用者的資料（prompt injection），RLS 也會擋住。**資料庫層面的安全，比應用層面的檢查更可靠。**

### 聊天持久化：onFinish callback

```typescript
async onFinish({ text }) {
  if (!sessionId) return;
  await authDb(user.id, async (tx) => {
    // 存 user 最後一則訊息
    const lastUserMsg = messages.filter((m) => m.role === "user").pop();
    if (lastUserMsg) {
      await tx.insert(chatMessages).values({
        sessionId, role: "user", content: userText,
      });
    }
    // 存 assistant 回覆
    if (text) {
      await tx.insert(chatMessages).values({
        sessionId, role: "assistant", content: text,
      });
    }
    // 更新 session 時間戳
    await tx.update(chatSessions)
      .set({ updatedAt: new Date() })
      .where(eq(chatSessions.id, sessionId));
  });
}
```

`onFinish` 在 streaming 完成後觸發，不會影響使用者感受到的回應速度。

### 前端：useChat + shadcn ai-elements

前端更簡單。`useChat` hook 處理所有 streaming 邏輯：

```typescript
import { useChat } from "@ai-sdk/react";

const { messages, input, handleSubmit, isLoading } = useChat({
  api: "/api/chat",
  body: { sessionId },
});
```

搭配 shadcn 的 ai-elements，聊天介面就完成了。不用自己處理 SSE、不用管 streaming buffer、不用寫 loading 狀態。

### 數字說話

| 檔案       | 行數       | 功能                      |
| ---------- | ---------- | ------------------------- |
| `route.ts` | 101 行     | Streaming + 認證 + 持久化 |
| `tools.ts` | 281 行     | 7 個 AI tools + RLS       |
| **合計**   | **382 行** | **完整 AI 聊天系統**      |

382 行 = 身份驗證 + Streaming 回應 + 7 個工具 + Tool Calling + 聊天記錄存 DB + RLS 安全 + 夏月 / 非夏月判斷 + 碳排計算 + 節電建議。

這就是「縫合」的威力 — 你不需要從零實作 streaming protocol，不需要寫 SSE server，不需要處理 tool calling 的狀態機。AI SDK 和 Supabase 幫你搞定底層，你只需要寫**業務邏輯**。

---

## 7. 踩坑紀錄與 MVP 心法

### 踩過的坑

**坑 1：Prisma → Drizzle 遷移**

一開始用 Prisma，後來發現它不支援 Supabase 的 RLS（Row Level Security）。Drizzle ORM 可以直接執行 raw SQL，所以能做到 `set_config('role', 'authenticated', true)` 這種操作。

教訓：**選 ORM 要看它跟你的後端服務合不合**，不是看誰星星多。

**坑 2：OAuth → Email/Password 簡化**

本來想做 Google OAuth 登入，結果發現 MVP 只有自己在用，搞 OAuth 要設定一堆 redirect URI 和 consent screen。後來直接用 Email/Password，帳號在 Supabase Dashboard 手動建。

教訓：**MVP 不需要完美的使用者體驗，先能動最重要。**

**坑 3：Passkey 嘗試失敗**

試過 WebAuthn / Passkey 登入，瀏覽器相容性跟 Supabase 的支援度都還不夠成熟。花了一天半最後放棄。

教訓：**太前沿的技術不適合 MVP。被工具限制的時間比寫 code 的時間還多。**

### MVP 心法

**心法 1：CLAUDE.md 就是你的架構文件**

不用另外寫 wiki 或 confluence。CLAUDE.md 既是給 AI 的上下文，也是給未來的自己（或隊友）的架構說明。**寫一份，兩邊都受益。**

**心法 2：選「黏膠少」的工具**

什麼是黏膠？就是工具之間的整合成本。Supabase 的 Auth + DB + Storage 是同一個服務，黏膠幾乎為零。相反地，如果你用 Auth0 + PlanetScale + S3，每個之間都要寫整合程式碼。

> 工具越獨立，整合成本越高。盡量選「套餐」而不是「單點」。

**心法 3：AI Chat 是 ROI 最高的功能**

382 行程式碼，但給使用者的感覺是「這個產品好智能」。相比起花幾百行刻一個表單、幾百行做一個圖表，AI 聊天的投入產出比碾壓其他功能。

如果你的 MVP 只能做一個亮點功能，**做 AI 聊天。**

**心法 4：MCP Server 是差異化亮點**

大部分產品都有 REST API，但有 MCP Server 的目前還很少。這意味著你的產品可以**直接出現在 Claude Desktop / ChatGPT 的對話流裡**，使用者不用切換 app。

553 行程式碼換來一個「哇，你的產品可以直接在 Claude 裡用耶」的反應，值得。

---

## 8. 總結

### 縫合清單回顧

```
Next.js 16 ─── 框架骨架
     ├── Supabase ─── Auth + DB + Storage（內臟）
     ├── Drizzle ORM ─── 資料存取 + RLS（血管）
     ├── shadcn/ui ─── UI 元件（皮膚）
     ├── Vercel AI SDK ─── AI 聊天（大腦）
     ├── MCP Server ─── 外部 AI 存取（神經系統）
     ├── Redux Toolkit ─── 狀態管理（肌肉）
     ├── Recharts ─── 數據視覺化（眼睛）
     └── Claude Code ─── 開發加速（縫合醫生的助手）
```

### 一句話總結

> 不要從零造輪子，做那個把輪子裝上車的人。

---

## Q&A

歡迎提問！

---

_Built with love, coffee, and a lot of stitching._
