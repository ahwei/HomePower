import { describe, it, expect } from "vitest";
import { getFallbackForecasts } from "@/lib/weather";

describe("weather", () => {
  describe("getFallbackForecasts", () => {
    it("returns 7 days of forecasts", () => {
      const forecasts = getFallbackForecasts();
      expect(forecasts).toHaveLength(7);
    });

    it("starts from today", () => {
      const forecasts = getFallbackForecasts();
      const today = new Date().toISOString().slice(0, 10);
      expect(forecasts[0].date).toBe(today);
    });

    it("has consistent default values", () => {
      const forecasts = getFallbackForecasts();
      for (const f of forecasts) {
        expect(f.highTemp).toBe(30);
        expect(f.lowTemp).toBe(24);
        expect(f.description).toBe("多雲");
        expect(f.estimatedAcHours).toBe(8);
      }
    });

    it("dates are consecutive", () => {
      const forecasts = getFallbackForecasts();
      for (let i = 1; i < forecasts.length; i++) {
        const prev = new Date(forecasts[i - 1].date);
        const curr = new Date(forecasts[i].date);
        const diffDays =
          (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
        expect(diffDays).toBe(1);
      }
    });
  });
});
