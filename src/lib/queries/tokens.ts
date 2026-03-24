import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type Supabase = SupabaseClient<Database>;

/** 建立新的 MCP API 權杖 */
export async function queryCreateToken(
  supabase: Supabase,
  userId: string,
  input: {
    name: string;
    tokenHash: string;
    tokenPrefix: string;
    expiresAt: string | null;
  }
) {
  const { data, error } = await supabase
    .from("mcp_tokens")
    .insert({
      user_id: userId,
      name: input.name,
      token_hash: input.tokenHash,
      token_prefix: input.tokenPrefix,
      expires_at: input.expiresAt,
    })
    .select("id")
    .single();

  if (error) throw error;
  return { id: data.id };
}

/** 撤銷 token（soft delete） */
export async function queryRevokeToken(
  supabase: Supabase,
  userId: string,
  tokenId: string
) {
  const { error } = await supabase
    .from("mcp_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", tokenId)
    .eq("user_id", userId);

  if (error) throw error;
}

/** 列出使用者的所有有效 tokens */
export async function queryGetTokens(supabase: Supabase, userId: string) {
  const { data, error } = await supabase
    .from("mcp_tokens")
    .select("id, name, token_prefix, last_used_at, expires_at, created_at")
    .eq("user_id", userId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    tokenPrefix: t.token_prefix,
    lastUsedAt: t.last_used_at ? new Date(t.last_used_at) : null,
    expiresAt: t.expires_at ? new Date(t.expires_at) : null,
    createdAt: new Date(t.created_at),
  }));
}

/** 驗證 MCP Bearer token（service role, 無 RLS） */
export async function queryValidateMcpToken(
  supabase: Supabase,
  tokenHash: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("mcp_tokens")
    .select("id, user_id, expires_at")
    .eq("token_hash", tokenHash)
    .is("revoked_at", null)
    .single();

  if (error || !data) return null;

  // 檢查過期
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null;

  // 更新 lastUsedAt（fire-and-forget）
  supabase
    .from("mcp_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id)
    .then(() => {});

  return data.user_id;
}
