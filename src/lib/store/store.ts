import { configureStore } from "@reduxjs/toolkit";
import { settingsSlice } from "./slices/settings-slice";
import { devicesSlice } from "./slices/devices-slice";

export const makeStore = () =>
  configureStore({
    reducer: {
      settings: settingsSlice.reducer,
      devices: devicesSlice.reducer,
    },
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
