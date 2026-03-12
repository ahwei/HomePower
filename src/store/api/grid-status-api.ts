import { createApi, fetchBaseQuery, retry } from "@reduxjs/toolkit/query/react";
import type { GridStatus } from "@/lib/types";

const baseQueryWithRetry = retry(fetchBaseQuery({ baseUrl: "/" }), {
  maxRetries: 3,
});

export const gridStatusApi = createApi({
  reducerPath: "gridStatusApi",
  baseQuery: baseQueryWithRetry,
  endpoints: (builder) => ({
    getGridStatus: builder.query<GridStatus, void>({
      query: () => "api/grid-status",
    }),
  }),
});

export const { useGetGridStatusQuery } = gridStatusApi;
