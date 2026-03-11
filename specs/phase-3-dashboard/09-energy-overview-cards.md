# Task #9: Dashboard — EnergyOverviewCards 元件

## 目標

顯示本月用電總覽：總用電量、預估電費、碳排放。

## 前置條件

- Task #4（RTK Store）
- Task #14（devices slice 可取得設備列表）

## 產出檔案

```
src/features/dashboard/components/energy-overview-cards.tsx
```

## 規格

### 三張卡片

| 卡片       | 數值計算                                      | 單位     | Icon        |
| ---------- | --------------------------------------------- | -------- | ----------- |
| 本月用電   | Σ (device.ratedPowerW × device.dailyHours × 30 / 1000) | kWh | Zap         |
| 預估電費   | 呼叫 calculateBill(totalKwh, planType, isSummer) | TWD    | Receipt     |
| 碳排放     | totalKwh × 0.494                              | kg CO₂   | Leaf        |

- 只計算 `isActive === true` 的設備
- 電價方案從 RTK settings slice 讀取
- 夏月自動判斷（月份 6-9）

### UI

- 使用 shadcn Card 元件
- 三欄 grid（md:grid-cols-3）
- 數值用大字體顯示
- 較上月 +/-% 的 diff badge（如有歷史資料）

### data-testid

- `energy-card-kwh`
- `energy-card-bill`
- `energy-card-co2`

## 驗收標準

- [ ] 設備列表為空時三張卡片顯示 0
- [ ] 新增一台 900W 冷氣 × 8h → 月用電 = 216 kWh
- [ ] 碳排放 = 216 × 0.494 ≈ 106.7 kg CO₂
- [ ] 切換電價方案時預估電費即時更新
- [ ] data-testid 正確
- [ ] `pnpm build` 通過
