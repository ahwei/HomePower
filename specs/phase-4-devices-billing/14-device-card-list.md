# Task #14: 設備管理 — DeviceCard + DeviceList

## 目標

建立設備卡片與列表元件，支援 CRUD 操作。

## 前置條件

- Task #2（型別定義）
- Task #4（RTK Store devices slice）

## 產出檔案

```
src/features/devices/components/device-card.tsx
src/features/devices/components/device-list.tsx
src/features/devices/hooks/use-devices.ts
```

## 規格

### device-card.tsx

- `"use client"`
- 顯示：設備名稱、類別圖示、額定功率 (W)、每日時數、月用電量 (kWh)
- 開關切換按鈕（toggle isActive）
- 編輯 / 刪除操作按鈕
- `role="switch"` + `aria-checked` on toggle
- data-testid: `device-card-{id}`, `device-toggle-{id}`

### device-list.tsx

- Grid layout（sm:grid-cols-2, lg:grid-cols-3）
- 空狀態：「尚未新增任何設備」+ 新增按鈕
- 統計列：總設備數、總月用電量

### use-devices.ts

- dispatch RTK thunks: fetchDevices, toggleDevice, deleteDevice
- useAppSelector 讀取 devices state

## 驗收標準

- [ ] DeviceCard 正確顯示設備資訊
- [ ] Toggle 切換後 isActive 狀態更新 + Supabase 同步
- [ ] 刪除設備後列表更新
- [ ] 空狀態正確顯示
- [ ] 無障礙：toggle 有 role="switch" + aria-checked
- [ ] `pnpm build` 通過
