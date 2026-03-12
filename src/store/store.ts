import { configureStore } from "@reduxjs/toolkit";
import { settingsSlice } from "./slices/settings-slice";
import { devicesApi } from "./api/devices-api";
import { gridStatusApi } from "./api/grid-status-api";
import { weatherApi } from "./api/weather-api";

export const makeStore = () =>
  configureStore({
    reducer: {
      settings: settingsSlice.reducer,
      [devicesApi.reducerPath]: devicesApi.reducer,
      [gridStatusApi.reducerPath]: gridStatusApi.reducer,
      [weatherApi.reducerPath]: weatherApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(
        devicesApi.middleware,
        gridStatusApi.middleware,
        weatherApi.middleware
      ),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
