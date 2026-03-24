import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  getUsageLogs,
  getDevicesForFilter,
  getWeeklyUsageTrend,
  getMonthlyUsageTrend,
  getCategoryUsage,
} from "@/actions/usage-logs";
import type { UsageLogFilters, UsageLogsResult } from "@/lib/queries/usage-logs";

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

    getWeeklyTrend: builder.query<
      { date: string; kwh: number }[],
      void
    >({
      queryFn: async () => {
        try {
          const rows = await withRetry(() => getWeeklyUsageTrend());
          return { data: rows };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR" as const,
              error: error instanceof Error ? error.message : "讀取週趨勢失敗",
            },
          };
        }
      },
    }),

    getMonthlyTrend: builder.query<
      { month: string; kwh: number }[],
      void
    >({
      queryFn: async () => {
        try {
          const rows = await withRetry(() => getMonthlyUsageTrend());
          return { data: rows };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR" as const,
              error: error instanceof Error ? error.message : "讀取月趨勢失敗",
            },
          };
        }
      },
    }),

    getCategoryUsage: builder.query<
      { category: string; deviceName: string; kwh: number }[],
      void
    >({
      queryFn: async () => {
        try {
          const rows = await withRetry(() => getCategoryUsage());
          return { data: rows };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR" as const,
              error: error instanceof Error ? error.message : "讀取分類用電失敗",
            },
          };
        }
      },
    }),
  }),
});

export const {
  useGetUsageLogsQuery,
  useGetDevicesForFilterQuery,
  useGetWeeklyTrendQuery,
  useGetMonthlyTrendQuery,
  useGetCategoryUsageQuery,
} = usageLogsApi;
