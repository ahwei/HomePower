import { createHash } from "crypto";
import { eq, and, isNull } from "drizzle-orm";
import { db } from "@/db";
import { mcpTokens } from "@/db/schema";

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/**
 * 驗證 MCP Bearer token，回傳 userId 或 null
 */
export async function validateMcpToken(
  rawToken: string
): Promise<string | null> {
  const hash = hashToken(rawToken);

  const [token] = await db
    .select()
    .from(mcpTokens)
    .where(
      and(eq(mcpTokens.tokenHash, hash), isNull(mcpTokens.revokedAt))
    );

  if (!token) return null;

  // 檢查過期
  if (token.expiresAt && token.expiresAt < new Date()) return null;

  // 更新 lastUsedAt（fire-and-forget）
  db.update(mcpTokens)
    .set({ lastUsedAt: new Date() })
    .where(eq(mcpTokens.id, token.id))
    .then(() => {});

  return token.userId;
}
