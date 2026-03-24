import { createHash } from "crypto";
import { createServiceClient } from "@/lib/supabase/service";
import { queryValidateMcpToken } from "@/lib/queries/tokens";

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
  const supabase = createServiceClient();
  return queryValidateMcpToken(supabase, hash);
}
