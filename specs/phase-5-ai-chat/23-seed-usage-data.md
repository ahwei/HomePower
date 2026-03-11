# Task #23: 模擬用電數據生成

## 目標

為 usage_logs 表生成模擬用電紀錄，供 Dashboard 圖表使用。

## 前置條件

- Task #1（DB Schema）
- Task #2（型別定義）

## 產出檔案

```
specs/seed/generate-usage-data.ts
```

在 package.json 新增 script：`"seed": "npx tsx specs/seed/generate-usage-data.ts"`

## 規格

### 生成邏輯

對每個使用者的每台 active 設備：

1. 讀取 rated_power_w 和 daily_hours
2. 根據 schedule 分配到對應小時
3. 無 schedule 的設備平均分配到所有使用時數
4. 每小時 kWh = rated_power_w / 1000 × (daily_hours / 使用時段數)
5. 加入隨機波動 ±10%

### 生成範圍

- 過去 30 天
- 每天 24 小時
- 每台 active 設備一筆 per hour（在使用時段內）

### 執行方式

```bash
pnpm seed
```

需設定 SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY（使用 service role 繞過 RLS）。

## 驗收標準

- [ ] 執行後 usage_logs 表有資料
- [ ] 每天每台設備的 kWh 加總 ≈ rated_power_w × daily_hours / 1000
- [ ] 資料有 ±10% 隨機波動（不完全相同）
- [ ] DailyUsageChart 可正確讀取並顯示
