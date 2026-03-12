import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { Device } from "@/lib/types";
import {
  getDevices,
  createDevice,
  toggleDevice as toggleDeviceAction,
  deleteDevice as deleteDeviceAction,
} from "@/app/actions/devices";

interface DevicesState {
  items: Device[];
  loading: boolean;
  error: string | null;
  fetched: boolean;
}

const initialState: DevicesState = {
  items: [],
  loading: false,
  error: null,
  fetched: false,
};

/** DB row → Device 型別轉換 */
function mapRow(row: Awaited<ReturnType<typeof getDevices>>[number]): Device {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    category: row.category as Device["category"],
    ratedPowerW: row.ratedPowerW,
    dailyHours: Number(row.dailyHours),
    isActive: row.isActive,
    schedule: row.schedule as Device["schedule"],
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : String(row.createdAt),
    updatedAt:
      row.updatedAt instanceof Date
        ? row.updatedAt.toISOString()
        : String(row.updatedAt),
  };
}

export const fetchDevices = createAsyncThunk("devices/fetch", async () => {
  const rows = await getDevices();
  return rows.map(mapRow);
});

export const addDevice = createAsyncThunk(
  "devices/add",
  async (device: {
    name: string;
    category: string;
    ratedPowerW: number;
    dailyHours: number;
  }) => {
    const row = await createDevice(device);
    return mapRow(row);
  }
);

export const toggleDevice = createAsyncThunk(
  "devices/toggle",
  async ({ id, isActive }: { id: string; isActive: boolean }) => {
    await toggleDeviceAction(id, isActive);
    return { id, isActive: !isActive };
  }
);

export const deleteDevice = createAsyncThunk(
  "devices/delete",
  async (id: string) => {
    await deleteDeviceAction(id);
    return id;
  }
);

export const devicesSlice = createSlice({
  name: "devices",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDevices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDevices.fulfilled, (state, action) => {
        state.loading = false;
        state.fetched = true;
        state.items = action.payload;
      })
      .addCase(fetchDevices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "讀取設備失敗";
      })
      .addCase(addDevice.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(toggleDevice.fulfilled, (state, action) => {
        const device = state.items.find((d) => d.id === action.payload.id);
        if (device) device.isActive = action.payload.isActive;
      })
      .addCase(deleteDevice.fulfilled, (state, action) => {
        state.items = state.items.filter((d) => d.id !== action.payload);
      });
  },
});
