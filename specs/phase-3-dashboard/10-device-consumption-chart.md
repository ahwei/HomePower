# Task #10: Dashboard — DeviceConsumptionChart 圓餅圖

## 目標

以圓餅圖顯示各設備用電佔比，搭配排行列表。

## 前置條件

- Task #3（recharts 已安裝）
- Task #14（devices 資料）

## 產出檔案

```
src/features/dashboard/components/device-consumption-chart.tsx
```

## 規格

### 圓餅圖

- 使用 Recharts `<PieChart>` + `<Pie>` + `<Cell>`
- 資料：各 active 設備的 monthlyKwh
- 顏色：依 category 分配固定色票
- Tooltip：設備名稱 + kWh + 佔比 %
- 中央顯示總用電量

### 排行列表

- 圓餅圖右側或下方
- 依 monthlyKwh 降序排列
- 每項：色票圓點 + 設備名 + kWh + 佔比%

### 色票對應

| Category      | 色碼    |
| ------------- | ------- |
| aircon        | #3b82f6 |
| kitchen       | #f59e0b |
| water_heater  | #ef4444 |
| laundry       | #8b5cf6 |
| entertainment | #ec4899 |
| office        | #6366f1 |
| lighting      | #10b981 |
| ev_charging   | #14b8a6 |

### 效能

- `React.memo` 包裝元件
- `useMemo` 計算圓餅資料
- `aria-label="各設備用電佔比圖表"`

## 驗收標準

- [ ] 圓餅圖正確顯示各設備佔比
- [ ] 2 台設備：冷氣 216kWh (77%) + 冰箱 31kWh (23%) → 圓餅比例正確
- [ ] 無設備時顯示空狀態提示
- [ ] React.memo 正確包裝（父層 re-render 時不觸發子層 re-render）
- [ ] `pnpm build` 通過
