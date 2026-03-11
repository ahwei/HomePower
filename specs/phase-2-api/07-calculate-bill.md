# Task #7: 電費計算邏輯 + API Route

## 目標

精確實作台電電價計算公式，包含住宅累進電價與時間電價方案。

## 前置條件

- Task #2 完成（ElectricityPlan, PriceTier 型別）

## 產出檔案

```
src/features/billing/utils/calculate-bill.ts   # 純函式
src/app/api/calculate-bill/route.ts             # API Route
```

## 計算邏輯 (calculate-bill.ts)

### 住宅電價（累進制）

每期用電度數按級距累進計費，夏月（6-9 月）與非夏月費率不同。

```typescript
function calculateResidentialBill(kwh: number, isSummer: boolean): BillResult
```

**級距表：**

| 級距        | 夏月 (TWD/kWh) | 非夏月 (TWD/kWh) |
| ----------- | -------------- | ---------------- |
| 1-120       | 1.68           | 1.68             |
| 121-330     | 2.45           | 2.16             |
| 331-500     | 3.70           | 3.03             |
| 501-700     | 5.04           | 4.14             |
| 701-1000    | 6.03           | 5.07             |
| 1001+       | 8.46           | 6.63             |

**計算範例（TC-06）：**

450 kWh 夏月：
- 120 × 1.68 = 201.6
- 210 × 2.45 = 514.5
- 120 × 3.70 = 444.0
- 合計 ≈ $1,160（加上公用電費分攤後約 $1,530）

450 kWh 非夏月：
- 120 × 1.68 = 201.6
- 210 × 2.16 = 453.6
- 120 × 3.03 = 363.6
- 合計 ≈ $1,019（加上分攤後約 $1,210）

> 注意：實際台電帳單為兩個月一期，此處以單月計算。

### 時間電價二段式

```typescript
function calculateTimeOfUse2Bill(
  peakKwh: number,
  offPeakKwh: number,
  isSummer: boolean
): BillResult
```

- 基本電費 + 流動電費
- 尖峰時段：週一至週五 07:30-22:30
- 離峰時段：其餘時間

### 時間電價三段式

```typescript
function calculateTimeOfUse3Bill(
  peakKwh: number,
  midPeakKwh: number,
  offPeakKwh: number,
  isSummer: boolean
): BillResult
```

### 回傳型別

```typescript
interface BillResult {
  totalAmount: number;        // 總電費 (TWD)
  breakdown: TierBreakdown[]; // 各級距明細
  avgRate: number;            // 平均單價 (TWD/kWh)
  planType: string;
  isSummer: boolean;
}

interface TierBreakdown {
  tier: string;    // "1-120度"
  kwh: number;     // 該級距用電
  rate: number;    // 單價
  amount: number;  // 小計
}
```

## API Route (calculate-bill/route.ts)

### Endpoint

`POST /api/calculate-bill`

### Request Body

```json
{
  "kwh": 450,
  "planType": "residential",
  "isSummer": true,
  "peakKwh": 300,
  "offPeakKwh": 150
}
```

### Response

```json
{
  "totalAmount": 1530,
  "breakdown": [
    { "tier": "1-120度", "kwh": 120, "rate": 1.68, "amount": 201.6 },
    { "tier": "121-330度", "kwh": 210, "rate": 2.45, "amount": 514.5 },
    { "tier": "331-500度", "kwh": 120, "rate": 3.70, "amount": 444.0 }
  ],
  "avgRate": 3.4,
  "planType": "residential",
  "isSummer": true
}
```

### 錯誤處理

- kwh < 0 或非數字 → 400 + `{ error: "請輸入有效的用電度數" }`
- 不支援的 planType → 400 + `{ error: "不支援的電價方案" }`

## 驗收標準

- [ ] `calculateResidentialBill(450, true)` 回傳 totalAmount ≈ 1160（純電費）
- [ ] `calculateResidentialBill(450, false)` 回傳 totalAmount ≈ 1019（純電費）
- [ ] breakdown 各級距 kwh 加總 = 輸入的總 kwh
- [ ] `curl -X POST http://localhost:8088/api/calculate-bill -d '{"kwh":450,"planType":"residential","isSummer":true}'` 回傳有效 JSON
- [ ] 輸入負數 kwh 回傳 400
- [ ] 時間電價方案 peakKwh + offPeakKwh 計算正確
- [ ] `pnpm build` 通過
