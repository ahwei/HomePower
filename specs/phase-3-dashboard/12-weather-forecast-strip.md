# Task #12: Dashboard — WeatherForecastStrip 元件

## 目標

顯示未來 7 天天氣預報與預估冷氣使用時數。

## 前置條件

- Task #6（/api/weather）

## 產出檔案

```
src/features/dashboard/components/weather-forecast-strip.tsx
src/features/dashboard/hooks/use-weather.ts
```

## 規格

### use-weather.ts

- fetch `/api/weather?location={location}`
- location 從 RTK settings slice 讀取
- polling interval: 1 小時
- 回傳 `{ data: WeatherForecast[], isLoading, error }`

### weather-forecast-strip.tsx

- `"use client"`
- 水平捲動卡片列（flex + overflow-x-auto）
- 每天一張卡片，顯示：
  - 日期（週幾）
  - 天氣描述（多雲時晴等）
  - 最高/最低溫
  - 預估冷氣時數
- 高溫 > 33°C 時卡片邊框標示警告色（amber）
- Loading：7 張 Skeleton 卡片

### 卡片 UI

```
┌──────────┐
│ 週三 3/12 │
│  ☀️ 晴    │
│  33/26°C │
│ 冷氣 8hr │
└──────────┘
```

天氣 icon 可用 lucide-react 的 Sun, Cloud, CloudRain 等。

## 驗收標準

- [ ] 顯示 7 張天氣卡片
- [ ] 每張包含日期、天氣描述、高低溫、冷氣時數
- [ ] 高溫 35°C → 卡片有警告色邊框
- [ ] 高溫 25°C → 冷氣時數 = 0
- [ ] 水平捲動在手機寬度正常運作
- [ ] `pnpm build` 通過
