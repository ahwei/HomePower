# Task #16: 設備管理 — DeviceScheduleEditor

## 目標

編輯設備使用排程（開始/結束時間），用於時間電價精確計算。

## 前置條件

- Task #14（DeviceCard）

## 產出檔案

```
src/features/devices/components/device-schedule-editor.tsx
```

## 規格

### UI

- 在 DeviceCard 點擊「排程」開啟
- 時間選擇：開始時間、結束時間（24h 格式）
- 顯示落在尖峰/離峰的時數比例
- 儲存到 devices.schedule JSONB：`{ start: "08:00", end: "22:00" }`

### 時間電價對照

- 選擇時間後，顯示該排程在尖峰/離峰各幾小時
- 例：08:00-22:00 → 尖峰 14h（07:30-22:30 內）、離峰 0h

## 驗收標準

- [ ] 可設定 start/end 時間
- [ ] 儲存後 device.schedule 更新
- [ ] 尖峰/離峰時數計算正確
- [ ] `pnpm build` 通過
