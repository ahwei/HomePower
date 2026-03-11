# Task #13: Dashboard 頁面整合

## 目標

將所有 Dashboard 元件整合到首頁，移除 stub placeholder。

## 前置條件

- Task #8（GridStatusBanner）
- Task #9（EnergyOverviewCards）
- Task #10（DeviceConsumptionChart）
- Task #11（DailyUsageChart）
- Task #12（WeatherForecastStrip）

## 修改檔案

```
src/app/(app)/page.tsx
```

## 頁面 Layout

```
┌─────────────────────────────────────────┐
│ SidebarTrigger │ Separator │ Dashboard  │  ← header
├─────────────────────────────────────────┤
│ GridStatusBanner (full width)           │
├─────────────────────────────────────────┤
│ EnergyOverviewCards (3-col grid)        │
├────────────────────┬────────────────────┤
│ DeviceConsumption  │ DailyUsageChart    │  ← md:grid-cols-2
│ Chart (pie)        │ (line)             │
├────────────────────┴────────────────────┤
│ WeatherForecastStrip (horizontal scroll)│
└─────────────────────────────────────────┘
```

### 響應式

- mobile: 單欄堆疊
- md+: 圖表區域雙欄

### Server Component 初始 Fetch

Dashboard page 可作為 Server Component，初始 fetch GridStatus + Weather 傳遞給子元件作為 initialData（減少 loading flash）。

## 驗收標準

- [ ] 頁面載入顯示所有 5 個元件
- [ ] 無 stub placeholder 殘留
- [ ] 響應式 layout 在手機/桌面正常
- [ ] Server-side 初始資料正確傳遞
- [ ] `pnpm build` 通過
