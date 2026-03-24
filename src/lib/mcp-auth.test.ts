import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHash } from "crypto";

// Mock Supabase service client
const mockSingle = vi.fn();
const mockIs = vi.fn(() => ({ single: mockSingle }));
const mockEq = vi.fn(() => ({ is: mockIs }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));
const mockUpdateEq = vi.fn(() => ({ then: vi.fn((cb: () => void) => cb()) }));
const mockUpdateSet = vi.fn(() => ({ eq: mockUpdateEq }));
const mockUpdate = vi.fn(() => ({ set: mockUpdateSet }));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({
    from: (table: string) => {
      if (table === "mcp_tokens") {
        return {
          select: mockSelect,
          update: mockUpdate,
        };
      }
      return { select: mockSelect };
    },
  }),
}));

// Import after mocks
import { validateMcpToken } from "@/lib/mcp-auth";

describe("validateMcpToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ is: mockIs });
    mockIs.mockReturnValue({ single: mockSingle });
    mockUpdate.mockReturnValue({ set: mockUpdateSet });
    mockUpdateSet.mockReturnValue({ eq: mockUpdateEq });
    mockUpdateEq.mockReturnValue({ then: vi.fn((cb: () => void) => cb()) });
  });

  it("returns null for unknown token", async () => {
    mockSingle.mockResolvedValue({ data: null, error: { code: "PGRST116" } });

    const result = await validateMcpToken("hp_unknowntoken123");
    expect(result).toBeNull();
  });

  it("returns userId for valid token", async () => {
    const rawToken = "hp_validtoken12345678901234567890";

    mockSingle.mockResolvedValue({
      data: {
        id: "token-id-1",
        user_id: "user-123",
        expires_at: null,
      },
      error: null,
    });

    const result = await validateMcpToken(rawToken);
    expect(result).toBe("user-123");
  });

  it("returns null for expired token", async () => {
    const rawToken = "hp_expiredtoken1234567890123456789";

    mockSingle.mockResolvedValue({
      data: {
        id: "token-id-2",
        user_id: "user-456",
        expires_at: "2020-01-01T00:00:00Z",
      },
      error: null,
    });

    const result = await validateMcpToken(rawToken);
    expect(result).toBeNull();
  });

  it("returns userId for non-expired token", async () => {
    const rawToken = "hp_futuretoken12345678901234567890";
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    mockSingle.mockResolvedValue({
      data: {
        id: "token-id-3",
        user_id: "user-789",
        expires_at: futureDate.toISOString(),
      },
      error: null,
    });

    const result = await validateMcpToken(rawToken);
    expect(result).toBe("user-789");
  });
});
