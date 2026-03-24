import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchGridStatus } from "@/lib/grid-status";

describe("fetchGridStatus", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("parses Taipower API response correctly", async () => {
    const mockResponse = {
      records: [
        // records[0]: current load
        { curr_load: "28500.5", curr_util_rate: "85.2" },
        // records[1]: forecast
        {
          fore_maxi_sply_capacity: "35000",
          fore_peak_resv_rate: "12.5",
          fore_peak_resv_capacity: "4375",
          fore_peak_dema_load: "30625",
          fore_peak_hour_range: "13:00-15:00",
          publish_time: "2026-03-12 10:00",
          fore_peak_resv_indicator: "G",
        },
        // records[2]: yesterday
        {
          yday_maxi_sply_capacity: "34000",
          yday_peak_dema_load: "29000",
          yday_peak_resv_rate: "14.7",
        },
      ],
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })
    );

    const result = await fetchGridStatus();

    expect(result.status).toBe("green");
    expect(result.currentLoadMW).toBe(28501);
    expect(result.supplyCapacityMW).toBe(35000);
    expect(result.reserveMarginPercent).toBe(12.5);
    expect(result.peakHourRange).toBe("13:00-15:00");
    expect(result.yesterday.peakLoadMW).toBe(29000);
  });

  it("throws when API returns non-ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 503 })
    );

    await expect(fetchGridStatus()).rejects.toThrow("台電 API 暫時無法連線");
  });

  it("throws when records format is invalid", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ records: [{}] }),
      })
    );

    await expect(fetchGridStatus()).rejects.toThrow("資料格式錯誤");
  });

  it("maps reserve indicator correctly", async () => {
    const makeResponse = (indicator: string) => ({
      records: [
        { curr_load: "28000", curr_util_rate: "80" },
        {
          fore_maxi_sply_capacity: "35000",
          fore_peak_resv_rate: "5",
          fore_peak_resv_capacity: "1750",
          fore_peak_dema_load: "33250",
          fore_peak_hour_range: "",
          publish_time: "",
          fore_peak_resv_indicator: indicator,
        },
        {
          yday_maxi_sply_capacity: "34000",
          yday_peak_dema_load: "29000",
          yday_peak_resv_rate: "14.7",
        },
      ],
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(makeResponse("R")),
      })
    );

    const result = await fetchGridStatus();
    expect(result.status).toBe("red");
  });
});
