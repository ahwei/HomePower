# HomePower — 家庭能源 Dashboard + 電費優化 AI 顧問

A full-stack home energy management dashboard with AI-powered electricity bill optimization, built with Next.js, Supabase, and Vercel AI SDK.

## Features

- **Real-time Grid Status** — Live Taiwan Power Company (台電) supply/demand status with color-coded indicators
- **Energy Dashboard** — Visualize household electricity usage, estimated bills, and carbon footprint
- **Device Management** — Add/edit simulated home appliances with power ratings and schedules
- **Bill Calculator** — Compare electricity plans (residential vs. time-of-use) with automatic cost estimation
- **AI Chat Agent** — Natural language assistant for energy-saving advice, bill analysis, and plan recommendations
- **Weather Integration** — 7-day forecast from Central Weather Administration with predicted AC usage

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| State (Server) | TanStack React Query v5 |
| State (Client) | Zustand v5 |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| AI | Vercel AI SDK v6 |
| Charts | Recharts v2 |
| Testing | Playwright (E2E) + Vitest (Unit) |
| Deployment | Vercel |

## Data Sources

- **台電即時供電資訊** — Open Data (JSON), refreshed every 5 minutes
- **台電各機組發電量** — Open Data (JSON), refreshed every 10 minutes
- **中央氣象署 Open API** — Weather forecast (requires API key)
- **台電電價方案** — Static config based on official rate tables
- **模擬設備資料** — Simulated appliance data stored in Supabase

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### 需申請的服務與 API Key

| # | 服務 | 用途 | 申請連結 | 費用 |
|---|------|------|----------|------|
| 1 | **Supabase** | 資料庫 + Auth | https://supabase.com/dashboard | Free tier |
| 2 | **Google OAuth** | 登入 | https://console.cloud.google.com/apis/credentials | 免費 |
| 3 | **GitHub OAuth** | 登入 | https://github.com/settings/developers | 免費 |
| 4 | **中央氣象署 Open API** | 天氣預報 | https://opendata.cwa.gov.tw | 免費（需註冊） |
| 5 | **OpenAI API** | AI Chat | https://platform.openai.com/api-keys | 依用量計費 |
| 6 | **Tavily API** | AI 網路搜尋 | https://tavily.com | 免費 1,000 次/月 |

> 詳細申請步驟請參考 `.env.example` 內的註解說明。

### Environment Variables

```bash
cp .env.example .env.local
# 編輯 .env.local 填入各服務的 API Key
```

### Installation

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Database Setup

Run the SQL schema in your Supabase SQL Editor:

```sql
-- See HomePower-Frontend-Design-Document.md Section 9.3 for full schema
-- Tables: devices, usage_logs, user_settings (with RLS policies)
```

Generate TypeScript types:

```bash
npx supabase gen types typescript --project-id your_project_id > src/lib/supabase/types.ts
```

## Project Structure

```
src/
├── app/                          # Next.js App Router pages + API routes
│   ├── page.tsx                  # Dashboard (home)
│   ├── devices/page.tsx          # Device management
│   ├── billing/page.tsx          # Bill calculator
│   ├── chat/page.tsx             # AI chat
│   └── api/                      # Route handlers (BFF)
├── features/                     # Feature-based modules
│   ├── dashboard/                # Grid status, charts, weather
│   ├── devices/                  # Device CRUD, schedules
│   ├── billing/                  # Plan selector, bill calculation
│   └── chat/                     # AI chat UI + agent tools
└── lib/                          # Shared utilities
    ├── supabase/                 # Client/server clients + types
    ├── constants/                # Electricity plans, device presets
    └── stores/                   # Zustand stores
```

## Simulated Devices

Pre-configured appliance templates with typical power ratings:

| Device | Power (W) | Typical Hours/Day |
|--------|-----------|-------------------|
| 變頻冷氣 | 900 | 8 |
| 變頻冰箱 (600L) | 130 | 24 (compressor ~8h) |
| 電熱水器 (50L) | 3,000 | 1.5 |
| 洗衣機（滾筒） | 500 | 0.5 |
| 烘衣機 | 2,400 | 0.5 |
| 電視 (65" LED) | 120 | 5 |
| 桌上型電腦 + 螢幕 | 350 | 8 |
| LED 照明 (全屋) | 100 | 6 |
| 除濕機 | 350 | 6 |
| EV 充電 (Level 2) | 7,200 | 4 (every 3 days) |

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Clients                          │
│  Browser (Next.js App)  │  Claude Desktop / Code    │
│         ↕ HTTP          │       ↕ mcp-remote        │
└────────────┬────────────┴────────────┬──────────────┘
             │                         │
┌────────────▼─────────────────────────▼──────────────┐
│              Next.js 16 Server                      │
│                                                     │
│  src/proxy.ts (Auth Middleware)                      │
│  ├── Session refresh (Supabase SSR)                 │
│  ├── Redirect unauthenticated → /login              │
│  └── Bypass: /api/mcp, /.well-known, /auth/*        │
│                                                     │
│  ┌─────────────────┐  ┌──────────────────────────┐  │
│  │  App Routes      │  │  API Routes              │  │
│  │  /(app)/*        │  │  /api/chat    (AI Chat)  │  │
│  │  /login          │  │  /api/mcp     (MCP SSE)  │  │
│  │  /settings/*     │  │  /api/grid-status        │  │
│  │                  │  │  /api/weather             │  │
│  └─────────────────┘  └──────────────────────────┘  │
│                                                     │
│  ┌─────────────────┐  ┌──────────────────────────┐  │
│  │  Server Actions  │  │  Shared Libraries        │  │
│  │  actions/devices │  │  lib/grid-status.ts      │  │
│  │  actions/tokens  │  │  lib/weather.ts          │  │
│  │  actions/chat    │  │  lib/mcp-auth.ts         │  │
│  └─────────────────┘  └──────────────────────────┘  │
│                                                     │
└───────────────────────┬─────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
┌──────────────┐ ┌────────────┐ ┌──────────────┐
│  Supabase    │ │  台電 API  │ │  中央氣象署  │
│  (PostgreSQL │ │  (供電狀態) │ │  (天氣預報)  │
│   + Auth)    │ │            │ │              │
└──────────────┘ └────────────┘ └──────────────┘
```

### MCP Server (`/api/mcp`)

HomePower 透過 MCP (Model Context Protocol) 將資料暴露給 AI 客戶端（Claude Desktop / Claude Code），使用 Streamable HTTP transport，以 Bearer token 驗證。

| 類型 | 名稱 | 說明 |
|------|------|------|
| Tool | `get_devices` | 查詢使用者的所有家電設備 |
| Tool | `get_device_summary` | 設備統計摘要（總數、用電量、類別佔比） |
| Tool | `calculate_bill` | 根據用電量計算電費（住宅/時間電價） |
| Tool | `get_usage_by_date_range` | 查詢日期區間的每日用電量 |
| Tool | `get_monthly_usage_summary` | 月度用電摘要與設備排名 |
| Tool | `get_energy_saving_tips` | 個人化節電建議 |
| Resource | `homepower://grid-status` | 台灣電力系統即時供電狀態 |
| Resource | `homepower://weather-forecast` | 7 天天氣預報與冷氣預估時數 |
| Prompt | `analyze-monthly` | 分析指定月份用電狀況 |
| Prompt | `saving-tips` | 個人化節電建議報告 |
| Prompt | `compare-regions` | 比較不同地區電力與天氣 |

### MCP 客戶端設定

**Claude Code**（貼到專案 `.mcp.json`）：
```json
{
  "mcpServers": {
    "homepower": {
      "url": "http://localhost:8088/api/mcp",
      "headers": { "Authorization": "Bearer hp_YOUR_TOKEN" }
    }
  }
}
```

**Claude Desktop**（貼到 `claude_desktop_config.json`，需 Node 20+）：
```json
{
  "mcpServers": {
    "homepower": {
      "command": "npx",
      "args": ["mcp-remote", "http://localhost:8088/api/mcp", "--header", "Authorization: Bearer hp_YOUR_TOKEN"]
    }
  }
}
```

> Token 可在「設定 → API 權杖」頁面建立。若使用 nvm，`command` 請改為 Node 20+ 的 npx 絕對路徑。

## AI Agent Tools

The AI chat assistant has access to:

- **queryDevices** — Query user's device list and usage
- **calculateBill** — Calculate electricity cost for given kWh and plan
- **getGridStatus** — Fetch real-time grid supply status
- **getWeather** — Get weather forecast for a location
- **comparePlans** — Compare different electricity plans
- **searchWeb** — Search for latest electricity information (via Tavily)

## Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e
```

## License

MIT
