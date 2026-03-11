# Task #8: Dashboard — GridStatusBanner 元件

## 目標

顯示台電即時供電狀態燈號。

## 前置條件

- Task #4（RTK Store）
- Task #5（/api/grid-status）

## 產出檔案

```
src/features/dashboard/components/grid-status-banner.tsx
src/features/dashboard/hooks/use-grid-status.ts
```

## 規格

### use-grid-status.ts

- 使用 RTK Query 的 `createApi` 或自訂 hook fetch `/api/grid-status`
- polling interval: 5 分鐘（300000ms）
- 回傳 `{ data: GridStatus | null, isLoading, error }`

### grid-status-banner.tsx

- `"use client"`
- 橫幅元件，置於 Dashboard 頂部
- 顯示內容：
  - 燈號圓點（綠/黃/橘/紅，用 CSS background-color）
  - 文字標籤：「供電充裕」/「供電警戒」/「供電吃緊」/「限電警報」
  - 備轉容量率百分比
  - 最後更新時間
- Loading 狀態：Skeleton
- Error 狀態：顯示「資料暫時無法載入」+ 最後一次有效資料

### 無障礙

- 燈號圓點 + 文字標籤並存（不只靠顏色）
- `aria-label="台電供電狀態：供電充裕，備轉容量率 12%"`

### data-testid

- `grid-status-banner` — 整個 banner
- `grid-status-light` — 燈號圓點
- `grid-status-label` — 文字標籤
- `grid-status-reserve` — 備轉容量率

## 驗收標準

- [ ] 元件正確渲染燈號 + 文字 + 備轉容量率
- [ ] 備轉容量率 12% → 綠燈 + 「供電充裕」
- [ ] 備轉容量率 5% → 橘燈 + 「供電吃緊」
- [ ] Loading 時顯示 Skeleton
- [ ] 有 aria-label
- [ ] `pnpm build` 通過
