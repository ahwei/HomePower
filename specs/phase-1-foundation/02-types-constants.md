# Task #2: 建立 TypeScript 型別定義 + 常數

## 目標

定義核心型別與預設資料常數，作為所有 feature 的基礎。

## 前置條件

- Task #1 完成（DB Schema 確認）

## 產出檔案

```
src/lib/
├── types.ts                          # 核心型別
├── constants/
│   ├── device-presets.ts             # 預設設備模板
│   └── electricity-plans.ts          # 台電電價方案
└── supabase/
    └── types.ts                      # DB types（手動或 gen types）
```

## 型別定義 (src/lib/types.ts)

```typescript
type DeviceCategory =
  | "aircon" | "kitchen" | "water_heater" | "laundry"
  | "entertainment" | "office" | "lighting" | "ev_charging";

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

interface ElectricityPlan {
  id: string;
  name: string;
  type: "residential" | "time_of_use_2" | "time_of_use_3";
  tiers: PriceTier[];
  peakHours?: { start: number; end: number };
}

interface PriceTier {
  min: number;
  max: number | null;
  summerRate: number;    // TWD/kWh（夏月 6-9 月）
  nonSummerRate: number; // TWD/kWh（非夏月）
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
  estimatedAcHours: number;
}
```

## 設備預設模板 (src/lib/constants/device-presets.ts)

| 設備              | 功率 (W) | 每日時數 | Category      |
| ----------------- | -------- | -------- | ------------- |
| 變頻冷氣 (1 對 1) | 900      | 8        | aircon        |
| 變頻冰箱 (600L)   | 130      | 24       | kitchen       |
| 電熱水器 (50L)    | 3000     | 1.5      | water_heater  |
| 洗衣機（滾筒）    | 500      | 0.5      | laundry       |
| 烘衣機            | 2400     | 0.5      | laundry       |
| 電視 (65 吋 LED)  | 120      | 5        | entertainment |
| 桌上型電腦 + 螢幕 | 350      | 8        | office        |
| LED 照明 (全屋)   | 100      | 6        | lighting      |
| 電鍋 / 電子鍋     | 800      | 0.5      | kitchen       |
| 除濕機            | 350      | 6        | aircon        |
| EV 充電 (Level 2) | 7200     | 4        | ev_charging   |

export 為 `DEVICE_PRESETS: DevicePreset[]`。

## 電價方案 (src/lib/constants/electricity-plans.ts)

### 住宅電價（累進 6 級距）

| 級距      | 夏月 (6-9 月) | 非夏月       |
| --------- | ------------- | ------------ |
| 1-120 度  | 1.68          | 1.68         |
| 121-330   | 2.45          | 2.16         |
| 331-500   | 3.70          | 3.03         |
| 501-700   | 5.04          | 4.14         |
| 701-1000  | 6.03          | 5.07         |
| 1001+     | 8.46          | 6.63         |

### 時間電價二段式

- 尖峰時段：07:30-22:30（夏月加成）
- 離峰時段：22:30-07:30
- 含基本電費

### 時間電價三段式

- 尖峰 / 半尖峰 / 離峰
- 含基本電費

> 費率以台電官網最新公告為準，開發時先用上述參考值。

## 驗收標準

- [ ] `import type { Device, GridStatus } from "@/lib/types"` 編譯通過
- [ ] `DEVICE_PRESETS` 共 11 筆，每筆有 name, ratedPowerW, dailyHours, category
- [ ] 電價方案住宅電價有 6 個 tier，每個 tier 有 summerRate + nonSummerRate
- [ ] `pnpm build` 通過，無 type error
