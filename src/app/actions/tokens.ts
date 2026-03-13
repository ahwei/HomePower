"use server";

import { randomBytes, createHash } from "crypto";
import { eq, and, isNull, desc } from "drizzle-orm";
import { db } from "@/db";
import { mcpTokens } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

async function getUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("未登入");
  return user.id;
}

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/**
 * 建立新的 MCP API 權杖
 * @returns raw token（僅此一次可見）
 */
export async function createToken(
  name: string,
  expiresInDays?: number
): Promise<{ id: string; rawToken: string; tokenPrefix: string }> {
  const userId = await getUserId();
  const raw = `hp_${randomBytes(20).toString("hex")}`;
  const hash = hashToken(raw);
  const prefix = raw.slice(0, 8);

  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : null;

  const [row] = await db
    .insert(mcpTokens)
    .values({
      userId,
      name,
      tokenHash: hash,
      tokenPrefix: prefix,
      expiresAt,
    })
    .returning({ id: mcpTokens.id });

  return { id: row.id, rawToken: raw, tokenPrefix: prefix };
}

/**
 * 撤銷 token（soft delete）
 */
export async function revokeToken(tokenId: string): Promise<void> {
  const userId = await getUserId();
  await db
    .update(mcpTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(mcpTokens.id, tokenId), eq(mcpTokens.userId, userId)));
}

/**
 * 列出使用者的所有有效 tokens（不含 hash）
 */
export async function getTokens(): Promise<
  Array<{
    id: string;
    name: string;
    tokenPrefix: string;
    lastUsedAt: Date | null;
    expiresAt: Date | null;
    createdAt: Date;
  }>
> {
  const userId = await getUserId();
  return db
    .select({
      id: mcpTokens.id,
      name: mcpTokens.name,
      tokenPrefix: mcpTokens.tokenPrefix,
      lastUsedAt: mcpTokens.lastUsedAt,
      expiresAt: mcpTokens.expiresAt,
      createdAt: mcpTokens.createdAt,
    })
    .from(mcpTokens)
    .where(and(eq(mcpTokens.userId, userId), isNull(mcpTokens.revokedAt)))
    .orderBy(desc(mcpTokens.createdAt));
}
