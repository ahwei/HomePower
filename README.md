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

> 詳細申請步驟請參考 `.env.local.example` 內的註解說明。

### Environment Variables

```bash
cp .env.local.example .env.local
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
