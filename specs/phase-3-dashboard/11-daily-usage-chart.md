# Task #11: Dashboard — DailyUsageChart 趨勢圖

## 目標

顯示每日 24 小時用電曲線，標示尖峰/離峰時段。

## 前置條件

- Task #3（recharts 已安裝）
- Task #23（usage_logs 模擬資料）

## 產出檔案

```
src/features/dashboard/components/daily-usage-chart.tsx
```

## 規格

### 圖表

- 使用 Recharts `<AreaChart>` 或 `<LineChart>`
- X 軸：0-23（小時）
- Y 軸：kWh
- 曲線平滑化（type="monotone"）
- 日期選擇器（可切換查看不同天）

### 時間電價時段標示

以半透明背景色標示尖峰/離峰時段：

| 時段             | 時間          | 背景色            |
| ---------------- | ------------- | ----------------- |
| 尖峰（二段式）    | 07:30-22:30   | rgba(红, 0.05)    |
| 離峰（二段式）    | 22:30-07:30   | rgba(绿, 0.05)    |

- 只在使用者選擇時間電價方案時顯示時段標示
- 方案資訊從 RTK settings slice 讀取

### 資料來源

- Supabase `usage_logs` 表
- Query: SELECT hour, SUM(kwh) FROM usage_logs WHERE date = ? GROUP BY hour

### Tooltip

- 顯示：時間（如 14:00）、用電量 (kWh)、尖峰/離峰標示

## 驗收標準

- [ ] 圖表顯示 24 個小時的用電資料
- [ ] 切換日期後圖表更新
- [ ] 選擇時間電價方案時顯示尖峰/離峰背景色
- [ ] 選擇住宅電價時不顯示時段背景色
- [ ] 無資料時顯示「尚無用電紀錄」
- [ ] `pnpm build` 通過
