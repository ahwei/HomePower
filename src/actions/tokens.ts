"use server";

import { randomBytes, createHash } from "crypto";
import { createClient } from "@/lib/supabase/server";
import {
  queryCreateToken,
  queryRevokeToken,
  queryGetTokens,
} from "@/queries/tokens";

async function getUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("未登入");
  return { userId: user.id, supabase };
}

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export async function createToken(
  name: string,
  expiresInDays?: number
): Promise<{ id: string; rawToken: string; tokenPrefix: string }> {
  const { userId, supabase } = await getUserId();
  const raw = `hp_${randomBytes(20).toString("hex")}`;
  const hash = hashToken(raw);
  const prefix = raw.slice(0, 8);

  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { id } = await queryCreateToken(supabase, userId, {
    name,
    tokenHash: hash,
    tokenPrefix: prefix,
    expiresAt,
  });

  return { id, rawToken: raw, tokenPrefix: prefix };
}

export async function revokeToken(tokenId: string): Promise<void> {
  const { userId, supabase } = await getUserId();
  await queryRevokeToken(supabase, userId, tokenId);
}

export async function getTokens() {
  const { userId, supabase } = await getUserId();
  return queryGetTokens(supabase, userId);
}
