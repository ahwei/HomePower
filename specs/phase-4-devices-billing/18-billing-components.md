# Task #18: 電費試算 — PlanSelector + BillCalculator + PlanComparisonTable

## 目標

建立電費試算頁面的三個核心元件。

## 前置條件

- Task #7（calculateBill 邏輯）
- Task #4（RTK Store settings slice）

## 產出檔案

```
src/features/billing/components/plan-selector.tsx
src/features/billing/components/bill-calculator.tsx
src/features/billing/components/plan-comparison-table.tsx
```

## 規格

### plan-selector.tsx

- 電價方案下拉選擇
- 選項：住宅電價、時間電價（二段式）、時間電價（三段式）
- 選擇後同步更新 RTK settings slice
- data-testid: `plan-selector`

### bill-calculator.tsx

- 根據使用者設備總用電 + 選擇的方案計算電費
- 呼叫 `calculateBill()` 純函式（client-side 計算，不需 API call）
- 顯示：
  - 總電費
  - 級距明細表（每級距的 kWh × 單價 = 小計）
  - 平均單價
  - 夏月/非夏月切換
- data-testid: `bill-result`

### plan-comparison-table.tsx

- 同時計算所有方案的電費
- 表格比較：方案名稱 | 電費 | 平均單價 | 差額
- 標示最划算的方案（highlight）
- 根據設備排程計算時間電價的尖峰/離峰用電分配

## 驗收標準

- [ ] 切換方案 → BillCalculator 即時重算（TC-05）
- [ ] 450 kWh 住宅電價夏月 ≈ $1,160 純電費（TC-06）
- [ ] PlanComparisonTable 顯示 3 種方案比較
- [ ] 最划算方案有 highlight 標示
- [ ] data-testid 正確
- [ ] `pnpm build` 通過
