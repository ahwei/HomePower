# Task #6: API Route — /api/weather

## 目標

建立中央氣象署天氣預報的 BFF proxy route。

## 前置條件

- Task #2 完成（WeatherForecast 型別）

## 產出檔案

```
src/app/api/weather/route.ts
```

## 規格

### Endpoint

`GET /api/weather?location=高雄`

### Query Parameters

| Param    | Type   | Default | Description |
| -------- | ------ | ------- | ----------- |
| location | string | "高雄"  | 縣市名稱    |

### 資料來源

中央氣象署 Open API：
- 一般天氣預報（3 天）: `F-C0032-001`
- 一週天氣預報: `F-D0047-091`（或對應縣市代碼）
- Header: `Authorization: CWA_API_KEY`

### 回傳格式

```typescript
interface WeatherResponse {
  location: string;
  forecasts: WeatherForecast[];
}

interface WeatherForecast {
  date: string;        // "2026-03-12"
  highTemp: number;    // 最高溫 °C
  lowTemp: number;     // 最低溫 °C
  description: string; // "多雲時晴"
  estimatedAcHours: number; // 預估冷氣使用時數
}
```

### 冷氣時數預估邏輯

| 最高溫    | 預估冷氣時數 |
| --------- | ------------ |
| < 26°C    | 0            |
| 26-29°C   | 4            |
| 30-33°C   | 8            |
| 34-36°C   | 12           |
| > 36°C    | 16           |

### Cache

```typescript
export const revalidate = 3600; // 1 小時
```

### 錯誤處理

- API 限流 (429) → 回傳靜態預設天氣資料 + header `X-Fallback: true`
- API Key 缺失 → 回傳 500 + `{ error: "CWA_API_KEY 未設定" }`
- API 無回應 → 回傳 503

## 驗收標準

- [ ] `curl http://localhost:8088/api/weather` 回傳 7 天預報
- [ ] `curl http://localhost:8088/api/weather?location=台北` 回傳台北資料
- [ ] 每筆 forecast 包含 date, highTemp, lowTemp, description, estimatedAcHours
- [ ] 高溫 35°C 時 estimatedAcHours = 12
- [ ] 缺少 CWA_API_KEY 時回傳 500 error
