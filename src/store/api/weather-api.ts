import { createApi, fetchBaseQuery, retry } from "@reduxjs/toolkit/query/react";
import type { WeatherForecast } from "@/lib/types";

const baseQueryWithRetry = retry(fetchBaseQuery({ baseUrl: "/" }), {
  maxRetries: 3,
});

interface WeatherResponse {
  location: string;
  forecasts: WeatherForecast[];
}

export const weatherApi = createApi({
  reducerPath: "weatherApi",
  baseQuery: baseQueryWithRetry,
  endpoints: (builder) => ({
    getWeather: builder.query<WeatherForecast[], string>({
      query: (location) =>
        `api/weather?location=${encodeURIComponent(location)}`,
      transformResponse: (response: WeatherResponse) =>
        response.forecasts ?? [],
    }),
  }),
});

export const { useGetWeatherQuery } = weatherApi;
