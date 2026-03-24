import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const globalForService = globalThis as unknown as {
  supabaseService: ReturnType<typeof createClient<Database>>;
};

export function createServiceClient() {
  if (globalForService.supabaseService) return globalForService.supabaseService;

  const client = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  if (process.env.NODE_ENV !== "production") {
    globalForService.supabaseService = client;
  }

  return client;
}
