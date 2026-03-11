# Task #15: 設備管理 — AddDeviceDialog

## 目標

新增設備對話框，含預設模板自動帶入。

## 前置條件

- Task #14（DeviceCard/DeviceList）

## 產出檔案

```
src/features/devices/components/add-device-dialog.tsx
```

需安裝 shadcn dialog：`pnpm dlx shadcn@latest add dialog select`

## 規格

### 表單欄位

| 欄位       | 類型     | 說明                               |
| ---------- | -------- | ---------------------------------- |
| 設備類型   | Select   | 從 DEVICE_PRESETS 載入，選擇後自動填入功率 |
| 設備名稱   | Input    | 預設帶入 preset 名稱，可自訂       |
| 額定功率   | Input    | 數字，單位 W                       |
| 每日時數   | Input    | 數字，單位小時                     |
| 預估月用電 | 顯示     | 即時計算 = 功率 × 時數 × 30 / 1000 |

### 技術

- react-hook-form + Zod schema
- Zod validation: ratedPowerW > 0, dailyHours 0-24
- submit → dispatch(addDevice(values))
- 成功後關閉 dialog + toast 通知

## 驗收標準

- [ ] 選擇「變頻冷氣」→ 功率自動填入 900W
- [ ] 調整時數為 10h → 預估月用電即時顯示 270 kWh
- [ ] 功率輸入 0 或負數 → 驗證錯誤
- [ ] 儲存後 DeviceList 出現新設備
- [ ] `pnpm build` 通過
