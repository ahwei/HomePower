import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod/v4";
import { eq, and, sql, desc, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { devices, usageLogs, userSettings } from "@/db/schema";
import { calculateBill } from "@/components/billing/calculate-bill";
import { isSummerMonth } from "@/constants/electricity-plans";
import {
  CATEGORY_LABELS,
  CO2_FACTOR_KG_PER_KWH,
} from "@/constants/device-presets";
import { validateMcpToken } from "@/lib/mcp-auth";
import { fetchGridStatus } from "@/lib/grid-status";
import { fetchWeatherForecast } from "@/lib/weather";
import type { PlanType } from "@/lib/types";

// ============================================================
// Helpers
// ============================================================

function extractBearerToken(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

function jsonResponse(body: object, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function textResult(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

function resourceResult(uri: string, data: unknown) {
  return {
    contents: [
      {
        uri,
        mimeType: "application/json" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

async function authenticateRequest(
  request: Request
): Promise<Response | string> {
  const token = extractBearerToken(request);
  if (!token) return jsonResponse({ error: "未提供 API 權杖" }, 401);

  const userId = await validateMcpToken(token);
  if (!userId)
    return jsonResponse({ error: "無效或已過期的 API 權杖" }, 401);

  return userId;
}

// ============================================================
// MCP Server Factory
// ============================================================

function createMcpServer(userId: string): McpServer {
  const server = new McpServer({
    name: "homepower",
    version: "1.0.0",
  });

  registerTools(server, userId);
  registerResources(server, userId);
  registerPrompts(server);

  return server;
}

// ---- Tools ----

function registerTools(server: McpServer, userId: string) {
  server.registerTool("get_devices", { description: "查詢使用者的所有家電設備" }, async () => {
    console.log(`[MCP] tool:get_devices`);

    const rows = await db
      .select()
      .from(devices)
      .where(eq(devices.userId, userId))
      .orderBy(desc(devices.createdAt));

    return textResult(
      rows.map((d) => ({
        name: d.name,
        category: CATEGORY_LABELS[d.category] ?? d.category,
        ratedPowerW: d.ratedPowerW,
        dailyHours: Number(d.dailyHours),
        isActive: d.isActive,
        monthlyKwh: Math.round(
          (d.ratedPowerW * Number(d.dailyHours) * 30) / 1000
        ),
      }))
    );
  });

  server.registerTool(
    "get_device_summary",
    { description: "取得設備統計摘要：總數、啟用數、預估月總用電量、各類別用電佔比" },
    async () => {
      console.log(`[MCP] tool:get_device_summary`);
      const rows = await db
        .select()
        .from(devices)
        .where(eq(devices.userId, userId));

      const activeRows = rows.filter((d) => d.isActive);
      const totalMonthlyKwh = activeRows.reduce(
        (sum, d) =>
          sum + (d.ratedPowerW * Number(d.dailyHours) * 30) / 1000,
        0
      );

      const byCategory: Record<string, number> = {};
      for (const d of activeRows) {
        const label = CATEGORY_LABELS[d.category] ?? d.category;
        const kwh = (d.ratedPowerW * Number(d.dailyHours) * 30) / 1000;
        byCategory[label] = (byCategory[label] ?? 0) + kwh;
      }

      return textResult({
        totalDevices: rows.length,
        activeDevices: activeRows.length,
        totalMonthlyKwh: Math.round(totalMonthlyKwh),
        co2Kg: Math.round(totalMonthlyKwh * CO2_FACTOR_KG_PER_KWH),
        categoryBreakdown: Object.entries(byCategory)
          .map(([cat, kwh]) => ({
            category: cat,
            kwh: Math.round(kwh),
            percent: Math.round((kwh / totalMonthlyKwh) * 100),
          }))
          .sort((a, b) => b.kwh - a.kwh),
      });
    }
  );

  server.registerTool(
    "calculate_bill",
    {
      description: "根據用電量計算電費。支援住宅累進制、時間電價二段式、三段式",
      inputSchema: z.object({
        kwh: z.number().describe("總用電量 kWh"),
        planType: z
          .enum(["residential", "time_of_use_2", "time_of_use_3"])
          .default("residential")
          .describe("電價方案"),
        month: z
          .number()
          .min(1)
          .max(12)
          .optional()
          .describe("月份（判斷夏月），不填預設當月"),
      }),
    },
    async ({
      kwh,
      planType,
      month,
    }: {
      kwh: number;
      planType: string;
      month?: number;
    }) => {
      console.log(`[MCP] tool:calculate_bill`, { kwh, planType, month });
      const isSummer = isSummerMonth(month);
      const result = calculateBill({
        kwh,
        planType: planType as PlanType,
        isSummer,
        peakKwh: Math.round(kwh * 0.6),
        offPeakKwh: Math.round(kwh * 0.4),
        midPeakKwh: Math.round(kwh * 0.25),
      });

      return textResult({
        ...result,
        isSummer,
        note: isSummer ? "夏月費率（6-9月）" : "非夏月費率",
      });
    }
  );

  server.registerTool(
    "get_usage_by_date_range",
    {
      description: "查詢指定日期區間的每日用電量（kWh）",
      inputSchema: z.object({
        startDate: z.string().describe("起始日期 YYYY-MM-DD"),
        endDate: z.string().describe("結束日期 YYYY-MM-DD"),
      }),
    },
    async ({
      startDate,
      endDate,
    }: {
      startDate: string;
      endDate: string;
    }) => {
      console.log(`[MCP] tool:get_usage_by_date_range`, { startDate, endDate });
      const rows = await db
        .select({
          date: usageLogs.date,
          totalKwh: sql<string>`sum(${usageLogs.kwh})::numeric(10,2)`,
        })
        .from(usageLogs)
        .where(
          and(
            eq(usageLogs.userId, userId),
            gte(usageLogs.date, new Date(startDate)),
            lte(usageLogs.date, new Date(endDate))
          )
        )
        .groupBy(usageLogs.date)
        .orderBy(usageLogs.date);

      return textResult(
        rows.map((r) => ({
          date:
            r.date instanceof Date
              ? r.date.toISOString().slice(0, 10)
              : String(r.date),
          kwh: Number(r.totalKwh),
        }))
      );
    }
  );

  server.registerTool(
    "get_monthly_usage_summary",
    {
      description: "查詢指定年月的月度用電摘要：總 kWh、日均 kWh、各設備用電排名",
      inputSchema: z.object({
        year: z.number().describe("年份，例如 2026"),
        month: z.number().min(1).max(12).describe("月份 1-12"),
      }),
    },
    async ({ year, month }: { year: number; month: number }) => {
      console.log(`[MCP] tool:get_monthly_usage_summary`, { year, month });
      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const endDate =
        month === 12
          ? `${year + 1}-01-01`
          : `${year}-${String(month + 1).padStart(2, "0")}-01`;

      const rows = await db
        .select({
          deviceId: usageLogs.deviceId,
          totalKwh: sql<string>`sum(${usageLogs.kwh})::numeric(10,2)`,
        })
        .from(usageLogs)
        .where(
          and(
            eq(usageLogs.userId, userId),
            gte(usageLogs.date, new Date(startDate)),
            lte(usageLogs.date, new Date(endDate))
          )
        )
        .groupBy(usageLogs.deviceId);

      const deviceRows = await db
        .select({ id: devices.id, name: devices.name })
        .from(devices)
        .where(eq(devices.userId, userId));

      const deviceMap = new Map(deviceRows.map((d) => [d.id, d.name]));
      const deviceUsage = rows
        .map((r) => ({
          device: deviceMap.get(r.deviceId ?? "") ?? "未知設備",
          kwh: Number(r.totalKwh),
        }))
        .sort((a, b) => b.kwh - a.kwh);

      const totalKwh = deviceUsage.reduce((s, d) => s + d.kwh, 0);
      const daysInMonth = new Date(year, month, 0).getDate();

      return textResult({
        year,
        month,
        totalKwh: Math.round(totalKwh),
        dailyAvgKwh: Math.round(totalKwh / daysInMonth),
        co2Kg: Math.round(totalKwh * CO2_FACTOR_KG_PER_KWH),
        deviceRanking: deviceUsage,
      });
    }
  );

  server.registerTool(
    "get_energy_saving_tips",
    { description: "根據使用者的設備和用電資料，提供節電建議" },
    async () => {
      console.log(`[MCP] tool:get_energy_saving_tips`);
      const rows = await db
        .select()
        .from(devices)
        .where(and(eq(devices.userId, userId), eq(devices.isActive, true)));

      const tips: string[] = [];
      const highPower = rows
        .filter((d) => d.ratedPowerW >= 1000)
        .sort((a, b) => b.ratedPowerW - a.ratedPowerW);

      for (const d of highPower) {
        const monthlyKwh =
          (d.ratedPowerW * Number(d.dailyHours) * 30) / 1000;
        if (d.category === "aircon" && Number(d.dailyHours) > 6) {
          tips.push(
            `${d.name}每日使用 ${d.dailyHours} 小時，月耗 ${Math.round(monthlyKwh)} kWh。建議搭配電扇，溫度設定 26-28°C，可節省 15-20% 用電`
          );
        } else if (
          d.category === "water_heater" &&
          d.ratedPowerW >= 3000
        ) {
          tips.push(
            `${d.name}（${d.ratedPowerW}W）耗電較高，月耗 ${Math.round(monthlyKwh)} kWh。建議考慮更換熱泵熱水器，可省 60-70% 電費`
          );
        } else {
          tips.push(
            `${d.name}（${d.ratedPowerW}W）月耗 ${Math.round(monthlyKwh)} kWh，建議減少使用時數或選用節能機型`
          );
        }
      }

      if (tips.length === 0) {
        tips.push("您的設備用電都在合理範圍內，繼續保持！");
      }

      return textResult({ tips });
    }
  );
}

// ---- Resources ----

function registerResources(server: McpServer, userId: string) {
  server.registerResource(
    "grid-status",
    "homepower://grid-status",
    {
      description: "台灣電力系統即時供電狀態（台電資料）",
      mimeType: "application/json",
    },
    async () => {
      try {
        const data = await fetchGridStatus();
        return resourceResult("homepower://grid-status", data);
      } catch (err) {
        return resourceResult("homepower://grid-status", {
          error: err instanceof Error ? err.message : "無法取得供電狀態",
        });
      }
    }
  );

  server.registerResource(
    "weather-forecast",
    "homepower://weather-forecast",
    {
      description: "7 天天氣預報與冷氣預估使用時數（中央氣象署資料）",
      mimeType: "application/json",
    },
    async () => {
      try {
        const [settings] = await db
          .select()
          .from(userSettings)
          .where(eq(userSettings.userId, userId));

        const location = settings?.location
          ? `${settings.location}市`
          : "高雄市";
        const data = await fetchWeatherForecast(location);
        return resourceResult("homepower://weather-forecast", data);
      } catch (err) {
        return resourceResult("homepower://weather-forecast", {
          error:
            err instanceof Error ? err.message : "無法取得天氣預報",
        });
      }
    }
  );
}

// ---- Prompts ----

function registerPrompts(server: McpServer) {
  server.registerPrompt(
    "analyze-monthly",
    {
      description: "分析指定月份的用電狀況並提供建議",
      argsSchema: {
        year: z.string().describe("年份，例如 2026"),
        month: z.string().describe("月份 1-12"),
      },
    },
    async ({ year, month }: { year: string; month: string }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `請分析我 ${year} 年 ${month} 月的用電狀況。

請使用以下工具取得資料：
1. get_monthly_usage_summary — 取得月度用電摘要
2. get_device_summary — 取得設備統計
3. calculate_bill — 用總 kWh 試算電費

然後請提供：
- 用電概覽（總量、日均、碳排）
- 各設備用電排名分析
- 與前月比較的趨勢（如有資料）
- 具體的節電建議`,
          },
        },
      ],
    })
  );

  server.registerPrompt(
    "saving-tips",
    { description: "根據目前設備取得個人化節電建議" },
    async () => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `請幫我分析目前的家電用電狀況並提供節電建議。

請使用以下工具：
1. get_devices — 查看所有設備
2. get_device_summary — 取得用電統計
3. get_energy_saving_tips — 取得自動化節電建議

然後綜合這些資料，給我一份完整的節電分析報告，包含：
- 目前用電概覽
- 耗電設備排名
- 針對每個高耗電設備的具體建議
- 預估節電效果`,
          },
        },
      ],
    })
  );

  server.registerPrompt(
    "compare-regions",
    {
      description: "比較不同地區的電力與天氣狀況",
      argsSchema: {
        region: z.string().describe("要比較的地區，例如：台北市"),
      },
    },
    async ({ region }: { region: string }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `請幫我比較「${region}」與我目前所在地的電力及天氣狀況。

請讀取以下 resources：
1. homepower://grid-status — 目前電網狀態
2. homepower://weather-forecast — 天氣預報

然後分析：
- 目前電網供電狀態與尖峰時段
- ${region}的天氣對冷氣使用的影響
- 針對當地天氣的用電建議`,
          },
        },
      ],
    })
  );
}

// ============================================================
// Route Handlers
// ============================================================

async function handleMcpRequest(request: Request): Promise<Response> {
  const method = request.method;
  const body = method === "POST" ? await request.clone().text() : null;

  console.log(`[MCP] ${method} /api/mcp`);
  if (body) {
    try {
      const parsed = JSON.parse(body);
      const rpcMethod = parsed.method ?? parsed.map?.((m: { method: string }) => m.method);
      console.log(`[MCP] → ${JSON.stringify(rpcMethod)}`, parsed.params ? JSON.stringify(parsed.params) : "");
    } catch {
      console.log(`[MCP] → (raw)`, body.slice(0, 200));
    }
  }

  const result = await authenticateRequest(request);
  if (result instanceof Response) {
    console.log(`[MCP] ✗ auth failed`);
    return result;
  }

  console.log(`[MCP] ✓ userId=${result.slice(0, 8)}...`);

  const server = createMcpServer(result);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
  });
  await server.connect(transport);

  const response = await transport.handleRequest(request, { parsedBody: body ? JSON.parse(body) : undefined });
  console.log(`[MCP] ← ${response.status}`);
  return response;
}

export async function POST(request: Request) {
  return handleMcpRequest(request);
}

export async function GET() {
  // Stateless mode: no SSE stream support, return 405
  return new Response(null, { status: 405 });
}

export async function DELETE() {
  return new Response(null, { status: 405 });
}
