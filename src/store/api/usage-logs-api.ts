import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  getUsageLogs,
  getDevicesForFilter,
  type UsageLogFilters,
  type UsageLogsResult,
} from "@/app/actions/usage-logs";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1500;

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

export const usageLogsApi = createApi({
  reducerPath: "usageLogsApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["UsageLogs"],
  endpoints: (builder) => ({
    getUsageLogs: builder.query<UsageLogsResult, UsageLogFilters>({
      queryFn: async (filters) => {
        try {
          const result = await withRetry(() => getUsageLogs(filters));
          return { data: result };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR" as const,
              error:
                error instanceof Error ? error.message : "讀取用電紀錄失敗",
            },
          };
        }
      },
      providesTags: ["UsageLogs"],
    }),

    getDevicesForFilter: builder.query<
      { id: string; name: string }[],
      void
    >({
      queryFn: async () => {
        try {
          const rows = await withRetry(() => getDevicesForFilter());
          return { data: rows };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR" as const,
              error:
                error instanceof Error ? error.message : "讀取設備清單失敗",
            },
          };
        }
      },
    }),
  }),
});

export const { useGetUsageLogsQuery, useGetDevicesForFilterQuery } =
  usageLogsApi;
