import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { Device } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

interface DevicesState {
  items: Device[];
  loading: boolean;
  error: string | null;
}

const initialState: DevicesState = {
  items: [],
  loading: false,
  error: null,
};

/** DB row → Device 型別轉換 */
function mapRow(row: Record<string, unknown>): Device {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    category: row.category as Device["category"],
    ratedPowerW: row.rated_power_w as number,
    dailyHours: row.daily_hours as number,
    isActive: row.is_active as boolean,
    schedule: row.schedule as Device["schedule"],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export const fetchDevices = createAsyncThunk(
  "devices/fetch",
  async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("devices")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapRow);
  }
);

export const addDevice = createAsyncThunk(
  "devices/add",
  async (device: {
    name: string;
    category: string;
    ratedPowerW: number;
    dailyHours: number;
  }) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("devices")
      .insert({
        name: device.name,
        category: device.category,
        rated_power_w: device.ratedPowerW,
        daily_hours: device.dailyHours,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return mapRow(data);
  }
);

export const toggleDevice = createAsyncThunk(
  "devices/toggle",
  async ({ id, isActive }: { id: string; isActive: boolean }) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("devices")
      .update({ is_active: !isActive })
      .eq("id", id);
    if (error) throw new Error(error.message);
    return { id, isActive: !isActive };
  }
);

export const deleteDevice = createAsyncThunk(
  "devices/delete",
  async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("devices").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return id;
  }
);

export const devicesSlice = createSlice({
  name: "devices",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetch
      .addCase(fetchDevices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDevices.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchDevices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "讀取設備失敗";
      })
      // add
      .addCase(addDevice.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      // toggle
      .addCase(toggleDevice.fulfilled, (state, action) => {
        const device = state.items.find((d) => d.id === action.payload.id);
        if (device) device.isActive = action.payload.isActive;
      })
      // delete
      .addCase(deleteDevice.fulfilled, (state, action) => {
        state.items = state.items.filter((d) => d.id !== action.payload);
      });
  },
});
