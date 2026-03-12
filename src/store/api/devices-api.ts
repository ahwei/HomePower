import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  getDevices,
  createDevice,
  toggleDevice as toggleDeviceAction,
  deleteDevice as deleteDeviceAction,
} from "@/app/actions/devices";
import type { Device } from "@/lib/types";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1500;

/** 帶重試的 async 呼叫 */
async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === MAX_RETRIES - 1) throw error;
      await new Promise((r) => setTimeout(r, RETRY_DELAY * (attempt + 1)));
    }
  }
  throw new Error("Unreachable");
}

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

export const devicesApi = createApi({
  reducerPath: "devicesApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["Devices"],
  endpoints: (builder) => ({
    getDevices: builder.query<Device[], void>({
      queryFn: async () => {
        try {
          const rows = await withRetry(() => getDevices());
          return { data: rows.map(mapRow) };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR" as const,
              error: error instanceof Error ? error.message : "讀取設備失敗",
            },
          };
        }
      },
      providesTags: ["Devices"],
    }),

    addDevice: builder.mutation<
      Device,
      { name: string; category: string; ratedPowerW: number; dailyHours: number }
    >({
      queryFn: async (device) => {
        try {
          const row = await createDevice(device);
          return { data: mapRow(row) };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR" as const,
              error: error instanceof Error ? error.message : "新增設備失敗",
            },
          };
        }
      },
      invalidatesTags: ["Devices"],
    }),

    toggleDevice: builder.mutation<void, { id: string; isActive: boolean }>({
      queryFn: async ({ id, isActive }) => {
        try {
          await toggleDeviceAction(id, isActive);
          return { data: undefined };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR" as const,
              error: error instanceof Error ? error.message : "切換失敗",
            },
          };
        }
      },
      invalidatesTags: ["Devices"],
    }),

    deleteDevice: builder.mutation<void, string>({
      queryFn: async (id) => {
        try {
          await deleteDeviceAction(id);
          return { data: undefined };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR" as const,
              error: error instanceof Error ? error.message : "刪除失敗",
            },
          };
        }
      },
      invalidatesTags: ["Devices"],
    }),
  }),
});

export const {
  useGetDevicesQuery,
  useAddDeviceMutation,
  useToggleDeviceMutation,
  useDeleteDeviceMutation,
} = devicesApi;
