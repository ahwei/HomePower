# Task #4: 建立 RTK (Redux Toolkit) Store + Provider

## 目標

使用 Redux Toolkit 建立全域狀態管理，取代原設計的 React Query + Zustand。

## 前置條件

- Task #3 完成（@reduxjs/toolkit, react-redux 已安裝）

## 產出檔案

```
src/lib/store/
├── store.ts              # configureStore
├── provider.tsx          # "use client" Redux Provider
├── hooks.ts              # useAppDispatch, useAppSelector
└── slices/
    ├── settings-slice.ts # 使用者偏好（電價方案、地區、人數）
    └── devices-slice.ts  # 設備 state + async thunk CRUD
```

## 規格

### store.ts

```typescript
import { configureStore } from "@reduxjs/toolkit";
// 組合所有 slices
// export type RootState, AppDispatch
```

### provider.tsx

- `"use client"` directive
- 包裝 `<Provider store={store}>`
- 在 `src/app/layout.tsx` 的 `<body>` 內使用

### hooks.ts

- `useAppDispatch` — typed dispatch
- `useAppSelector` — typed selector

### settings-slice.ts

| State          | Type   | Default        |
| -------------- | ------ | -------------- |
| planType       | string | "residential"  |
| location       | string | "高雄"         |
| householdSize  | number | 3              |
| isSummer       | boolean | 自動判斷（6-9 月）|

Actions: `setPlanType`, `setLocation`, `setHouseholdSize`

### devices-slice.ts

使用 RTK `createAsyncThunk` 搭配 Supabase client：

| Thunk         | Supabase Operation                   |
| ------------- | ------------------------------------ |
| fetchDevices  | SELECT * FROM devices WHERE user_id  |
| addDevice     | INSERT INTO devices                  |
| updateDevice  | UPDATE devices SET ...               |
| deleteDevice  | DELETE FROM devices WHERE id         |
| toggleDevice  | UPDATE devices SET is_active = !     |

State: `{ items: Device[], loading: boolean, error: string | null }`

### RTK Query API（選用）

如需 server state caching，可另建 `src/lib/store/api.ts` 用 RTK Query 的 `createApi` 管理 `/api/grid-status`、`/api/weather` 等外部 API。

## Layout 整合

```tsx
// src/app/layout.tsx
import { StoreProvider } from "@/lib/store/provider";

// <body> 內加入
<StoreProvider>
  {children}
</StoreProvider>
```

## 驗收標準

- [ ] `pnpm build` 通過
- [ ] StoreProvider 正確包裹在 root layout
- [ ] 在任意 client component 可 `useAppSelector(s => s.settings.planType)` 取得 "residential"
- [ ] `dispatch(setPlanType("time_of_use_2"))` 後 selector 回傳新值
- [ ] devices slice: dispatch(fetchDevices()) 可從 Supabase 讀取設備列表
