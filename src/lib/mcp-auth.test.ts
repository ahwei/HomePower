import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHash } from "crypto";

// Mock drizzle DB
const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();
const mockSet = vi.fn();
const mockThen = vi.fn();

vi.mock("@/db", () => ({
  db: {
    select: () => ({ from: mockFrom }),
    update: () => ({ set: mockSet }),
  },
}));

vi.mock("@/db/schema", () => ({
  mcpTokens: {
    tokenHash: "token_hash",
    revokedAt: "revoked_at",
    id: "id",
    lastUsedAt: "last_used_at",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: (col: string, val: unknown) => ({ col, val, op: "eq" }),
  and: (...args: unknown[]) => ({ args, op: "and" }),
  isNull: (col: string) => ({ col, op: "isNull" }),
}));

// Import after mocks
import { validateMcpToken } from "@/lib/mcp-auth";

describe("validateMcpToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: mockFrom returns mockWhere chain
    mockFrom.mockReturnValue({ where: mockWhere });
    mockSet.mockReturnValue({ where: vi.fn().mockReturnValue({ then: mockThen }) });
    mockThen.mockImplementation((cb: () => void) => cb());
  });

  it("returns null for unknown token", async () => {
    mockWhere.mockResolvedValue([]);

    const result = await validateMcpToken("hp_unknowntoken123");
    expect(result).toBeNull();
  });

  it("returns userId for valid token", async () => {
    const rawToken = "hp_validtoken12345678901234567890";
    const hash = createHash("sha256").update(rawToken).digest("hex");

    mockWhere.mockResolvedValue([
      {
        id: "token-id-1",
        userId: "user-123",
        tokenHash: hash,
        expiresAt: null,
        revokedAt: null,
      },
    ]);

    const result = await validateMcpToken(rawToken);
    expect(result).toBe("user-123");
  });

  it("returns null for expired token", async () => {
    const rawToken = "hp_expiredtoken1234567890123456789";

    mockWhere.mockResolvedValue([
      {
        id: "token-id-2",
        userId: "user-456",
        expiresAt: new Date("2020-01-01"),
        revokedAt: null,
      },
    ]);

    const result = await validateMcpToken(rawToken);
    expect(result).toBeNull();
  });

  it("returns userId for non-expired token", async () => {
    const rawToken = "hp_futuretoken12345678901234567890";
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    mockWhere.mockResolvedValue([
      {
        id: "token-id-3",
        userId: "user-789",
        expiresAt: futureDate,
        revokedAt: null,
      },
    ]);

    const result = await validateMcpToken(rawToken);
    expect(result).toBe("user-789");
  });
});
