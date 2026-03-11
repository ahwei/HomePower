# Task #5: API Route — /api/grid-status

## 目標

建立台電即時供電狀態的 BFF proxy route。

## 前置條件

- Task #2 完成（GridStatus 型別）

## 產出檔案

```
src/app/api/grid-status/route.ts
```

## 規格

### Endpoint

`GET /api/grid-status`

### 資料來源

台電即時供電資訊 Open Data：
- URL: `https://data.taipower.com.tw/opendata/apply/file/d006001/001.json`（或 data.gov.tw/dataset/8931 提供的 JSON endpoint）
- 格式: JSON，每 5 分鐘更新

### 回傳格式

```typescript
interface GridStatusResponse {
  status: "green" | "yellow" | "orange" | "red";
  supplyCapacityMW: number;   // 供電能力 (MW)
  currentLoadMW: number;       // 目前負載 (MW)
  reserveMarginPercent: number; // 備轉容量率 (%)
  updatedAt: string;           // ISO 8601
}
```

### 燈號判斷邏輯

| 備轉容量率       | 燈號   |
| ---------------- | ------ |
| ≥ 10%            | green  |
| 6% - 10%         | yellow |
| 3% - 6%          | orange |
| < 3%             | red    |

### Cache

```typescript
export const revalidate = 300; // 5 分鐘
```

### 錯誤處理

- 台電 API 無回應 → 回傳 503 + `{ error: "台電 API 暫時無法連線" }`
- 回傳資料格式異常 → 回傳 502 + `{ error: "資料格式錯誤" }`

## 驗收標準

- [ ] `curl http://localhost:8088/api/grid-status` 回傳有效 JSON
- [ ] 回傳包含 status, supplyCapacityMW, currentLoadMW, reserveMarginPercent
- [ ] 5 分鐘內重複請求使用 cache（不重新 fetch 台電 API）
- [ ] 台電 API 模擬斷線時回傳 503
