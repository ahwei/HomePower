import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock validateMcpToken
const mockValidate = vi.fn();
vi.mock("@/lib/mcp-auth", () => ({
  validateMcpToken: (...args: unknown[]) => mockValidate(...args),
}));

// Mock the MCP SDK
vi.mock("@modelcontextprotocol/sdk/server/mcp.js", () => {
  return {
    McpServer: class MockMcpServer {
      registerTool = vi.fn();
      registerResource = vi.fn();
      registerPrompt = vi.fn();
      connect = vi.fn();
    },
  };
});

vi.mock("@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js", () => {
  return {
    WebStandardStreamableHTTPServerTransport: class MockTransport {
      handleRequest = vi.fn().mockResolvedValue(new Response("ok"));
    },
  };
});

// Mock Supabase service client
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({ from: vi.fn() }),
}));

// Mock shared query modules
vi.mock("@/lib/queries/devices", () => ({
  queryDevicesForTool: vi.fn(),
  queryDeviceSummary: vi.fn(),
  queryEnergySavingTips: vi.fn(),
}));
vi.mock("@/lib/queries/usage-logs", () => ({
  queryUsageByDateRange: vi.fn(),
  queryMonthlyUsageSummary: vi.fn(),
}));
vi.mock("@/lib/queries/user-settings", () => ({
  queryGetUserSettings: vi.fn(),
}));
vi.mock("@/components/billing/calculate-bill", () => ({
  calculateBill: vi.fn(),
}));
vi.mock("@/constants/electricity-plans", () => ({
  isSummerMonth: vi.fn(),
}));
vi.mock("@/constants/device-presets", () => ({
  CATEGORY_LABELS: {},
  CO2_FACTOR_KG_PER_KWH: 0.494,
}));
vi.mock("@/lib/grid-status", () => ({
  fetchGridStatus: vi.fn(),
}));
vi.mock("@/lib/weather", () => ({
  fetchWeatherForecast: vi.fn(),
}));

import { POST, GET, DELETE } from "@/app/api/mcp/route";

describe("MCP Route Handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST", () => {
    it("returns 401 when no Authorization header", async () => {
      const request = new Request("http://localhost/api/mcp", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      expect(response.status).toBe(401);

      const body = await response.json();
      expect(body.error).toBe("未提供 API 權杖");
    });

    it("returns 401 for invalid token", async () => {
      mockValidate.mockResolvedValue(null);

      const request = new Request("http://localhost/api/mcp", {
        method: "POST",
        headers: { Authorization: "Bearer hp_invalidtoken" },
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      expect(response.status).toBe(401);

      const body = await response.json();
      expect(body.error).toBe("無效或已過期的 API 權杖");
    });

    it("delegates to MCP transport for valid token", async () => {
      mockValidate.mockResolvedValue("user-123");

      const request = new Request("http://localhost/api/mcp", {
        method: "POST",
        headers: { Authorization: "Bearer hp_validtoken" },
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      expect(mockValidate).toHaveBeenCalledWith("hp_validtoken");
    });
  });

  describe("GET", () => {
    it("returns 405 (stateless mode, no SSE)", async () => {
      const response = await GET();
      expect(response.status).toBe(405);
    });
  });

  describe("DELETE", () => {
    it("returns 405 (stateless mode)", async () => {
      const response = await DELETE();
      expect(response.status).toBe(405);
    });
  });
});
