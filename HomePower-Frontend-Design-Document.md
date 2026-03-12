# HomePower — 家庭能源 Dashboard + 電費優化 AI 顧問

## FullStack Development Design Document (前端開發設計文件)

- **Version**: 1.0.0
- **Date**: 2026-03-11
- **Author**: Ahwei
- **Tech Stack**: Next.js + Supabase + Vercel AI SDK + Vercel

---

## 1. Change Description (變更描述)

### 1.1 Background (背景)

台灣家庭用電缺乏即時可視化工具，多數人只在收到電費帳單時才意識到用電異常。搭配台電時間電價方案的推廣，需要一個能讓一般使用者輕鬆理解用電狀況並獲得 AI 建議的工具。

此專案同時作為技術 Portfolio 展示，展現 Full-stack TypeScript + AI SDK + Supabase 的整合能力。

### 1.2 Objective (目標)

- 提供家庭用電即時 Dashboard，含模擬設備功耗追蹤
- 串接台電 Open Data 與中央氣象署 API，提供電網狀態和天氣資訊
- AI Agent 可用自然語言查詢電費、用電建議、設備比較等
- 支援多種台電電價方案的自動試算與推薦

### 1.3 Scope (範圍)

- **In Scope**: Dashboard UI、模擬設備管理、電費試算、AI Chat Agent、台電/氣象 API 整合
- **Out of Scope**: 真實 IoT 設備連接、即時電表讀取（AMI）、帳單支付功能、Mobile App

### 1.4 Data Sources (資料來源)

| Data Source         | Type             | URL / Note                             |
| ------------------- | ---------------- | -------------------------------------- |
| 台電即時供電資訊    | Open Data (JSON) | data.gov.tw/dataset/8931               |
| 台電各機組發電量    | Open Data (JSON) | data.gov.tw/dataset/37331 (每 10 分鐘) |
| 台電電價方案        | Static Config    | 台電官網電價表，手動建檔               |
| 中央氣象署 Open API | REST API         | opendata.cwa.gov.tw（需申請 API Key）  |
| 模擬設備資料        | Supabase DB      | 自建假資料（冷氣、冰箱、電熱水器等）   |

---

## 2. Component Design (元件設計)

### 2.1 Component Tree

```
App (Layout)
├── Sidebar
│     ├── NavLinks
│     └── UserProfile
├── DashboardPage
│     ├── GridStatusBanner          ← 台電即時供電狀態
│     ├── EnergyOverviewCards       ← 總用電 / 預估電費 / 碳排放
│     ├── DeviceConsumptionChart    ← 各設備用電圓餅圖 + 列表
│     ├── DailyUsageChart           ← 每日用電趨勢圖
│     └── WeatherForecastStrip      ← 未來 7 天氣溫 + 用電預測
├── DevicesPage
│     ├── DeviceList
│     │     └── DeviceCard (× N)    ← 設備卡片含開關狀態
│     ├── AddDeviceDialog            ← 新增模擬設備
│     └── DeviceScheduleEditor       ← 設備排程編輯
├── BillingPage
│     ├── PlanSelector               ← 選擇電價方案
│     ├── BillCalculator             ← 試算結果
│     └── PlanComparisonTable        ← 方案比較表
└── ChatPage
      ├── MessageList
      │     ├── UserMessage
      │     └── AssistantMessage
      │           └── MarkdownRenderer
      ├── InputComposer
      └── SuggestedQuestions         ← 建議問題快捷鍵
```

### 2.2 Component Specifications

| Component              | Responsibility                           | Key Props / State               |
| ---------------------- | ---------------------------------------- | ------------------------------- |
| GridStatusBanner       | 顯示台電即時供電燈號（綠/黃/橘/紅）      | gridStatus, reserveMargin       |
| EnergyOverviewCards    | 總覽數據卡片（本月用電、預估電費、碳排） | totalKwh, estimatedBill, co2    |
| DeviceConsumptionChart | 各設備用電佔比圓餅圖 + 排行列表          | devices[], timeRange            |
| DailyUsageChart        | 每日 24 小時用電曲線圖                   | dailyData[], selectedDate       |
| DeviceCard             | 單一設備的狀態卡片含開關切換             | device, onToggle, onEdit        |
| PlanSelector           | 選擇台電電價方案（住宅/時間電價）        | plans[], selectedPlan, onChange |
| BillCalculator         | 根據用電量和方案計算電費                 | usage, plan → calculatedBill    |
| ChatPage               | AI 對話介面，使用 AI SDK useChat         | messages[], streaming state     |

### 2.3 Simulated Devices (模擬設備清單)

系統預設提供以下模擬家電設備，使用者可自行新增或修改：

| Device                | Rated Power (W) | Typical Hours/Day | Monthly kWh | Category |
| --------------------- | --------------- | ----------------- | ----------- | -------- |
| 變頻冷氣 (1 對 1)     | 900             | 8                 | ~216        | 空調     |
| 變頻冰箱 (600L)       | 130             | 24 (壓縮機約 8h)  | ~31         | 廚房     |
| 電熱水器 (50L)        | 3000            | 1.5               | ~135        | 熱水     |
| 洗衣機（滾筒）        | 500             | 0.5 (每次)        | ~7.5        | 洗衣     |
| 烘衣機                | 2400            | 0.5 (每次)        | ~36         | 洗衣     |
| 電視 (65 吋 LED)      | 120             | 5                 | ~18         | 娛樂     |
| 桌上型電腦 + 螢幕     | 350             | 8                 | ~84         | 辦公     |
| LED 照明 (全屋 10 組) | 100 (total)     | 6                 | ~18         | 照明     |
| 電鍋 / 電子鍋         | 800             | 0.5               | ~12         | 廚房     |
| 除濕機                | 350             | 6                 | ~63         | 空調     |
| EV 充電（Level 2）    | 7200            | 4 (every 3 days)  | ~288        | 交通     |

每個設備包含：名稱、額定功率、每日使用時數、排程（可選）、開關狀態。使用者可調整參數觀察對電費的影響。

---

## 3. UI Flow (使用者介面流程)

### 3.1 Flow: Dashboard 概覽

| Step | Type        | Description                                      |
| ---- | ----------- | ------------------------------------------------ |
| 1    | User Action | 使用者進入 Dashboard 頁面                        |
| 2    | API Action  | GET /api/grid-status（台電即時供電狀態）         |
| 3    | API Action  | GET /api/weather（氣象署天氣預報）               |
| 4    | API Action  | Supabase: 查詢使用者的設備清單 + 今日用電        |
| 5    | UI Display  | 渲染 GridStatusBanner（供電燈號）                |
| 6    | UI Display  | 渲染 EnergyOverviewCards（總用電、預估電費）     |
| 7    | UI Display  | 渲染 DeviceConsumptionChart + DailyUsageChart    |
| 8    | UI Display  | 渲染 WeatherForecastStrip（7 天天氣 + 用電預測） |

### 3.2 Flow: 設備管理

| Step | Type        | Description                                                |
| ---- | ----------- | ---------------------------------------------------------- |
| 1    | User Action | 使用者點擊「新增設備」按鈕                                 |
| 2    | UI Display  | 顯示 AddDeviceDialog（設備類型下拉 + 功率輸入 + 每日時數） |
| 3    | User Action | 選擇「變頻冷氣」，系統自動帶入預設功率 900W                |
| 4    | User Action | 調整每日使用時數為 10 小時                                 |
| 5    | UI Action   | 即時計算預估月用電量：900W × 10h × 30d = 270 kWh           |
| 6    | User Action | 點擊「儲存」                                               |
| 7    | API Action  | Supabase INSERT: devices table                             |
| 8    | UI Display  | DeviceList 更新，新設備出現並計入總用電                    |

### 3.3 Flow: AI 電費諮詢

| Step | Type        | Description                                                         |
| ---- | ----------- | ------------------------------------------------------------------- |
| 1    | User Action | 使用者輸入「我家上個月用了 450 度，有沒有更省的方案？」             |
| 2    | API Action  | POST /api/chat → AI SDK streamText                                  |
| 3    | UI Action   | Agent 判斷需要 tool: queryDevices + calculateBill                   |
| 4    | API Action  | Tool: 查詢使用者設備清單和用電模式                                  |
| 5    | API Action  | Tool: 分別用住宅電價和時間電價方案計算 450 度電費                   |
| 6    | UI Display  | 串流顯示 AI 回覆：比較兩種方案的費用差異                            |
| 7    | UI Display  | AI 建議：若能將冷氣和洗衣移到離峰時段，時間電價可省 15%             |
| 8    | UI Display  | 顯示 SuggestedQuestions：「如何設定冷氣排程？」「離峰時段是幾點？」 |

---

## 4. State Management (狀態管理)

| State           | Location                        | Type        | Description                        |
| --------------- | ------------------------------- | ----------- | ---------------------------------- |
| gridStatus      | React Query                     | ServerState | 台電即時供電資訊（5 分鐘 refetch） |
| weatherForecast | React Query                     | ServerState | 7 天天氣預報                       |
| devices         | React Query + Supabase Realtime | ServerState | 使用者的設備清單                   |
| dailyUsage      | React Query                     | ServerState | 每日模擬用電量                     |
| selectedPlan    | Zustand                         | ClientState | 使用者選擇的電價方案               |
| selectedDate    | useState                        | LocalState  | Dashboard 選擇的日期               |
| chatMessages    | useChat (AI SDK)                | LocalState  | AI 對話訊息                        |

### 4.1 Key Decisions

- 使用 React Query 管理所有 server state，搭配 staleTime 控制 refetch 頻率
- 設備列表透過 Supabase Realtime 訂閱，任何裝置新增/修改/刪除都即時更新 UI
- 電價方案選擇存入 Zustand store，跨頁面共享（Dashboard + Billing 都會用到）
- AI Chat 狀態由 AI SDK 的 useChat hook 管理，不需額外 state management

---

## 5. API Integration (API 整合)

### 5.1 Next.js Route Handlers (BFF)

| Endpoint            | Method | Source            | Description                     |
| ------------------- | ------ | ----------------- | ------------------------------- |
| /api/grid-status    | GET    | 台電 Open Data    | 取得即時供電資訊，cache 5 分鐘  |
| /api/weather        | GET    | 氣象署 API        | 取得 7 天天氣預報，cache 1 小時 |
| /api/calculate-bill | POST   | Internal Logic    | 輸入用電量 + 方案 → 計算電費    |
| /api/chat           | POST   | AI SDK streamText | AI Chat 對話端點（SSE 串流）    |

### 5.2 Supabase Direct Access

| Table         | Operations     | RLS Policy           |
| ------------- | -------------- | -------------------- |
| devices       | CRUD           | user_id = auth.uid() |
| usage_logs    | INSERT, SELECT | user_id = auth.uid() |
| user_settings | SELECT, UPDATE | user_id = auth.uid() |

### 5.3 AI Agent Tools

| Tool Name     | Description                  | Parameters        |
| ------------- | ---------------------------- | ----------------- |
| queryDevices  | 查詢使用者的設備列表和用電量 | userId            |
| calculateBill | 計算指定用電量的電費         | kWh, planType     |
| getGridStatus | 取得台電即時供電狀態         | (none)            |
| getWeather    | 取得指定地點天氣預報         | location          |
| searchWeb     | 搜尋網路取得最新電力資訊     | query (Tavily)    |
| comparePlans  | 比較不同電價方案的費用差異   | kWh, usagePattern |

---

## 6. Error Handling (錯誤處理)

| Scenario          | Error Type | UI Response                                           | Recovery                   |
| ----------------- | ---------- | ----------------------------------------------------- | -------------------------- |
| 台電 API 無回應   | Network    | 使用最後一次 cache 資料 + 顯示「資料更新於 X 分鐘前」 | 背景每分鐘重試             |
| 氣象署 API 限流   | 429        | 顯示靜態天氣資訊                                      | 等待 cooldown 後自動重試   |
| Supabase 連線中斷 | Network    | Toast 通知「連線中斷」                                | Supabase Realtime 自動重連 |
| AI 串流中斷       | Network    | 保留已收到的文字 + 顯示「回覆中斷」+ 重試按鈕         | 使用者點重試               |
| 電費計算溢位      | Logic      | 顯示「請確認輸入數值」提示                            | 使用者修正輸入             |
| 設備功率異常值    | Validation | 輸入欄位標紅 + 提示合理範圍                           | 使用者修正後重新計算       |

---

## 7. Data Selectors & Testing (資料選擇器與測試)

### 7.1 Data Selectors (data-testid)

| Selector               | Element                | Purpose              |
| ---------------------- | ---------------------- | -------------------- |
| grid-status-banner     | GridStatusBanner       | 供電狀態燈號顯示測試 |
| energy-card-{type}     | EnergyOverviewCards    | 總覽卡片數據正確性   |
| device-card-{id}       | DeviceCard             | 設備狀態互動測試     |
| device-toggle-{id}     | DeviceCard toggle      | 設備開關切換         |
| plan-selector          | PlanSelector           | 電價方案選擇         |
| bill-result            | BillCalculator output  | 電費計算結果         |
| chat-input             | InputComposer textarea | AI 聊天輸入          |
| chat-message-{index}   | MessageList item       | 訊息渲染             |
| suggested-question-{i} | SuggestedQuestions     | 建議問題點擊         |

### 7.2 Test Cases

| ID    | Category  | Description                           | Expected Result                    |
| ----- | --------- | ------------------------------------- | ---------------------------------- |
| TC-01 | Dashboard | 頁面載入顯示供電狀態                  | GridStatusBanner 顯示正確燈號      |
| TC-02 | Dashboard | 設備用電圓餅圖正確計算佔比            | 各設備 kWh 加總 = 總用電           |
| TC-03 | Device    | 新增冷氣設備                          | DeviceList 出現新設備 + 總電費更新 |
| TC-04 | Device    | 關閉設備                              | 設備 kWh 歸零 + Dashboard 數據更新 |
| TC-05 | Billing   | 切換電價方案                          | BillCalculator 即時重算            |
| TC-06 | Billing   | 450 kWh 住宅電價計算                  | 夏月 ~$1,530 / 非夏月 ~$1,210      |
| TC-07 | AI Chat   | 問「我的電費怎麼降低」                | Agent 查設備後給出具體建議         |
| TC-08 | AI Chat   | 串流回應中途取消                      | 保留已收到文字 + Stop 按鈕正常     |
| TC-09 | Error     | 台電 API 斷線                         | 使用 cache + 顯示警示標籤          |
| TC-10 | E2E       | 完整流程：新增設備→看 Dashboard→問 AI | 全程資料一致                       |

---

## 8. Performance & Accessibility (效能與無障礙)

### 8.1 Performance

- 台電 / 氣象 API 結果透過 Next.js Route Handler cache（ISR 機制），避免前端直接打外部 API
- Dashboard 圖表使用 React.memo + useMemo 避免不必要的 re-render
- AI Chat 使用 SSE 串流，首字延遲需低於 1 秒
- 設備列表超過 20 個時啟用虛擬化捲動
- 圖表庫使用 Recharts（輕量）或 Lightweight Charts（高效能時序圖）

### 8.2 Accessibility

- 供電燈號不只用顏色，同時顯示文字標籤（「供電充裕」「供電吃緊」等）
- 所有圖表提供 aria-label 摘要描述
- 設備開關：role="switch" + aria-checked
- Chat 輸入：aria-label="輸入問題" + Enter 送出
- Error 訊息：role="alert" 讓螢幕閱讀器即時播報

---

## 9. AI Implementation Metadata (AI 實作規格)

### 9.1 Tech Stack

| Layer          | Technology                       | Version / Note       |
| -------------- | -------------------------------- | -------------------- |
| Framework      | Next.js (App Router)             | 15.x                 |
| Language       | TypeScript                       | 5.x, strict mode     |
| Styling        | Tailwind CSS + shadcn/ui         | v4                   |
| State (Server) | TanStack React Query             | v5                   |
| State (Client) | Zustand                          | v5                   |
| Database       | Supabase (PostgreSQL)            | Hosted, Free tier OK |
| Auth           | Supabase Auth (or Auth0)         | Email + OAuth        |
| AI             | Vercel AI SDK                    | v6 (ToolLoopAgent)   |
| Search Tool    | Tavily                           | @tavily/ai-sdk       |
| Charts         | Recharts                         | v2                   |
| Testing        | Playwright (E2E) + Vitest (Unit) | —                    |
| Deployment     | Vercel                           | Free / Pro tier      |

### 9.2 File Structure

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                        # Dashboard (首頁)
│   ├── devices/page.tsx                # 設備管理
│   ├── billing/page.tsx                # 電費試算
│   ├── chat/page.tsx                   # AI 諮詢
│   └── api/
│       ├── grid-status/route.ts        # 台電 API proxy + cache
│       ├── weather/route.ts            # 氣象署 API proxy
│       ├── calculate-bill/route.ts     # 電費計算邏輯
│       └── chat/route.ts              # AI SDK streamText + tools
├── features/
│   ├── dashboard/
│   │   ├── components/
│   │   │   ├── GridStatusBanner.tsx
│   │   │   ├── EnergyOverviewCards.tsx
│   │   │   ├── DeviceConsumptionChart.tsx
│   │   │   ├── DailyUsageChart.tsx
│   │   │   └── WeatherForecastStrip.tsx
│   │   └── hooks/
│   │       ├── useGridStatus.ts
│   │       └── useWeather.ts
│   ├── devices/
│   │   ├── components/
│   │   │   ├── DeviceList.tsx
│   │   │   ├── DeviceCard.tsx
│   │   │   ├── AddDeviceDialog.tsx
│   │   │   └── DeviceScheduleEditor.tsx
│   │   └── hooks/
│   │       └── useDevices.ts
│   ├── billing/
│   │   ├── components/
│   │   │   ├── PlanSelector.tsx
│   │   │   ├── BillCalculator.tsx
│   │   │   └── PlanComparisonTable.tsx
│   │   └── utils/
│   │       └── calculateBill.ts        # 台電電價公式
│   └── chat/
│       ├── components/
│       │   ├── ChatPage.tsx
│       │   ├── MessageList.tsx
│       │   └── SuggestedQuestions.tsx
│       └── tools/                      # AI Agent tools
│           ├── queryDevices.ts
│           ├── calculateBill.ts
│           ├── getGridStatus.ts
│           └── getWeather.ts
├── lib/
│   ├── supabase/
│   │   ├── client.ts                   # Browser client
│   │   ├── server.ts                   # Server client
│   │   └── types.ts                    # Generated DB types
│   ├── constants/
│   │   ├── electricity-plans.ts        # 台電電價方案定義
│   │   └── device-presets.ts           # 預設設備模板
│   └── stores/
│       └── useSettingsStore.ts         # Zustand store
└── e2e/
    ├── dashboard.spec.ts
    ├── devices.spec.ts
    └── chat.spec.ts
```

### 9.3 Database Schema (Supabase)

```sql
-- devices: 使用者的模擬設備
CREATE TABLE devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,              -- 空調/廚房/洗衣/娛樂/辦公/照明/交通
  rated_power_w INTEGER NOT NULL,      -- 額定功率 (Watt)
  daily_hours DECIMAL(4,1) NOT NULL,   -- 每日使用時數
  is_active BOOLEAN DEFAULT true,
  schedule JSONB,                      -- 可選排程 {start: '08:00', end: '22:00'}
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- usage_logs: 每日用電紀錄（模擬生成）
CREATE TABLE usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  device_id UUID REFERENCES devices(id),
  date DATE NOT NULL,
  hour INTEGER CHECK (hour >= 0 AND hour <= 23),
  kwh DECIMAL(8,3) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- user_settings: 使用者偏好設定
CREATE TABLE user_settings (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
  plan_type TEXT DEFAULT 'residential',    -- residential / time_of_use
  location TEXT DEFAULT '高雄',
  household_size INTEGER DEFAULT 3
);

-- RLS Policies
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own devices"
  ON devices FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users view own usage"
  ON usage_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own settings"
  ON user_settings FOR ALL USING (auth.uid() = user_id);
```

### 9.4 Key Type Definitions

```typescript
interface Device {
  id: string;
  userId: string;
  name: string;
  category: DeviceCategory;
  ratedPowerW: number;
  dailyHours: number;
  isActive: boolean;
  schedule?: { start: string; end: string };
  monthlyKwh: number; // computed: ratedPowerW * dailyHours * 30 / 1000
}

type DeviceCategory =
  | "aircon"
  | "kitchen"
  | "water_heater"
  | "laundry"
  | "entertainment"
  | "office"
  | "lighting"
  | "ev_charging";

interface ElectricityPlan {
  id: string;
  name: string; // "住宅電價" | "時間電價(二段式)" | ...
  type: "residential" | "time_of_use_2" | "time_of_use_3";
  tiers: PriceTier[];
  peakHours?: { start: number; end: number };
}

interface PriceTier {
  min: number; // 起始度數
  max: number | null; // 結束度數 (null = 無上限)
  summerRate: number; // 夏月單價 (TWD/kWh)
  nonSummerRate: number; // 非夏月單價
}

interface GridStatus {
  status: "green" | "yellow" | "orange" | "red";
  supplyCapacityMW: number;
  currentLoadMW: number;
  reserveMarginPercent: number;
  updatedAt: string;
}

interface WeatherForecast {
  date: string;
  highTemp: number;
  lowTemp: number;
  description: string;
  estimatedAcHours: number; // AI 預測的冷氣使用時數
}
```

### 9.5 Implementation Notes for AI

1. 使用 `"use client"` directive 只在需要互動的 component 上（Charts, DeviceCard toggle, Chat）
2. Dashboard 頁面的 GridStatusBanner 和 WeatherForecastStrip 可作為 Server Component 做初始 fetch
3. 電費計算邏輯（`calculateBill.ts`）需精確實作台電累進電價，夏月 6-9 月費率不同
4. AI Agent route (`/api/chat`) 使用 ToolLoopAgent，maxSteps 設為 5 避免無限 loop
5. 模擬用電數據用 Supabase Edge Function 每小時生成（基於設備功率 + 隨機波動 ±10%）
6. 所有外部 API 呼叫加 try-catch + fallback，永遠不讓外部 API 失敗導致頁面 crash
7. Supabase types 用 `npx supabase gen types typescript` 自動生成

---

## 10. Milestones (開發里程碑)

| Week   | Milestone                  | Deliverable                                                  |
| ------ | -------------------------- | ------------------------------------------------------------ |
| Week 1 | 專案骨架 + Supabase Schema | Next.js 專案初始化、DB schema 建好、Auth 設定完成、設備 CRUD |
| Week 2 | Dashboard + 外部 API 整合  | 台電/氣象 API 串接、GridStatusBanner、Charts 基礎版本        |
| Week 3 | 電費計算 + 設備管理完善    | 電價方案試算、設備排程編輯、模擬數據生成                     |
| Week 4 | AI Chat Agent              | AI SDK 整合、Tool 定義與測試、串流 UI、SuggestedQuestions    |
| Week 5 | E2E 測試 + 優化 + 部署     | Playwright 測試、效能優化、Vercel 部署、README 撰寫          |

---

## 11. Future Enhancements（未來擴展路線圖）

> 接續 Phase 5（AI Chat Agent，已完成），以下為 Phase 6–9 規劃。

### Phase 6：Smart Energy Intelligence

| #   | Feature                                                                                       | AI                                                        | Open Data                                                       | Supabase              | New                        |
| --- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------- | --------------------- | -------------------------- |
| 6-1 | **Energy Knowledge RAG** — pgvector 語意搜尋節能文件/家電規格/電價法規                        | `searchEnergyKnowledge` tool + `text-embedding-3-small`   | 能源局節能文件、能源效率標示 `ranking.energylabel.org.tw`        | pgvector 擴充         | `energy_knowledge` table   |
| 6-2 | **台美電價比較** — EIA API 抓美國各州住宅電價，Dashboard 卡片 + AI 比較工具                    | `compareInternationalRates` tool                          | US EIA API v2 `api.eia.gov`、EPA eGRID 碳排係數                 | —                     | `/api/energy/us-rates` route |
| 6-3 | **Row-Level Security** — 所有 table 加 RLS policy `auth.uid() = user_id`                      | —                                                         | —                                                               | RLS policies × 5 tables | migration                |
| 6-4 | **用電異常偵測** — AI 分析 7 天用電 vs 30 天均值 × 天氣，Dashboard alert                      | `detectUsageAnomalies` tool                               | 既有天氣 + usage_logs                                           | Edge Function (optional cron) | `anomaly_alerts` table |

### Phase 7：Real-Time Dashboard & Advanced Analytics

| #   | Feature                                                                                       | AI                                                        | Open Data                                                       | Supabase                         | New                              |
| --- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------- | -------------------------------- | -------------------------------- |
| 7-1 | **Realtime 設備狀態** — 裝置 toggle/usage 即時同步所有 client                                 | —                                                         | —                                                               | Realtime (Postgres Changes)      | `useRealtimeDevices` hook        |
| 7-2 | **碳排放強度追蹤** — 台電即時發電結構 → 加權碳排強度 gCO₂/kWh                                 | `getOptimalUsageTime` tool（最便宜+最綠時段）             | 台電發電結構 `genary.json`、EPA eGRID                           | Storage（歷史快照）              | `/api/carbon-intensity` route    |
| 7-3 | **AI 月報 PDF** — AI 撰寫摘要 + 圖表 → PDF 存 Supabase Storage                               | `generateMonthlyReport` tool                              | 全部內部資料                                                    | Storage (bucket `energy-reports`) + signed URLs | `reports` table、`/reports` page |
| 7-4 | **預測用電量** — 歷史用電 + 天氣預報 → 預測 7 天 kWh + 預估帳單                               | `forecastUsage` tool (structured output)                  | CWA 天氣（既有）                                                | —                                | `UsageForecastChart` component   |

### Phase 8：Platform Intelligence & Cross-Region

| #   | Feature                                                                                       | AI                                                        | Open Data                                                       | Supabase                                | New                              |
| --- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------- | --------------------------------------- | -------------------------------- |
| 8-1 | **Edge Functions** — 排程異常偵測、報表生成、資料匯入 → Deno Edge Functions                    | —                                                         | —                                                               | Edge Functions + pg_cron + DB Webhooks  | 3 Edge Functions                 |
| 8-2 | **美國各州能源 Dashboard** — 50 州電價/碳排/再生能源比較頁 `/compare`                          | `analyzeRegionalComparison` tool                          | EIA 州電力、NOAA 氣候 `ncdc.noaa.gov`                           | Storage（快取）                         | `/compare` page                  |
| 8-3 | **Multi-Turn Agent + Web Search** — OpenAI web search + 對話記憶 (pgvector)                    | `searchChatHistory` tool + web search                     | OpenAI web search                                               | pgvector (chat embeddings)              | `chat_messages.embedding` column |
| 8-4 | **Push Notifications** — 限電警報、帳單超標、異常通知 → Service Worker                         | —                                                         | —                                                               | Realtime + DB Webhooks                  | `notification_preferences` table |

### Phase 9：MCP Server

| #   | Feature                                                                                                                                                        | Description                                                                                          | Exposed Tools / Resources                                                                                                         |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 9-1 | **HomePower MCP Server** — 將設備資料、電費計算、用電分析暴露為 MCP tools，讓 Claude Desktop / Claude Code / 任何 MCP client 直接查詢                          | TypeScript MCP server（`@modelcontextprotocol/sdk`），透過 stdio transport 連接，以 Supabase service role 存取資料 | `getDevices`、`getDeviceSummary`、`calculateBill`、`getUsageByDateRange`、`getMonthlyUsageSummary`、`getEnergySavingTips`、`searchEnergyKnowledge` |
| 9-2 | **MCP Resources** — 暴露 Dashboard 狀態為 MCP resources（唯讀）                                                                                               | 台電供電狀態、天氣預報、碳排強度作為 MCP resources，client 可訂閱即時更新                             | `grid-status://current`、`weather://forecast`、`carbon://intensity`                                                               |
| 9-3 | **MCP Prompts** — 預設分析 prompt templates                                                                                                                    | 月度分析報告、節電建議、台美比較等 prompt templates 讓 MCP client 一鍵觸發                           | `analyze-monthly`、`saving-tips`、`compare-regions`                                                                               |

### 新增環境變數

| Variable                   | Phase | Source                |
| -------------------------- | ----- | --------------------- |
| `EIA_API_KEY`              | 6-2   | US EIA（free）        |
| `SUPABASE_SERVICE_ROLE_KEY`| 6-3   | Supabase Dashboard    |
| `NOAA_API_TOKEN`           | 8-2   | NOAA CDO（free）      |

### AI Tools 路線：7 → 15

現有 7 tools + 8 新增：`searchEnergyKnowledge`、`compareInternationalRates`、`detectUsageAnomalies`、`getOptimalUsageTime`、`generateMonthlyReport`、`forecastUsage`、`analyzeRegionalComparison`、`searchChatHistory`

### MCP 暴露：7 tools + 3 resources + 3 prompts

Phase 9 將既有 AI tools 重新封裝為 MCP protocol，讓任何 MCP client（Claude Desktop、Claude Code、Cursor 等）直接存取 HomePower 資料
