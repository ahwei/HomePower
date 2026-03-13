import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof drizzle<typeof schema>>;
};

export const db =
  globalForDb.db ??
  drizzle({
    connection: { connectionString: process.env.DATABASE_URL! },
    schema,
  });

if (process.env.NODE_ENV !== "production") globalForDb.db = db;

/**
 * Run a callback within a transaction that enforces RLS as the given user.
 *
 * Sets `role = authenticated` and injects `request.jwt.claims` so that
 * `auth.uid()` resolves to the provided userId inside the transaction.
 * The role is automatically reset when the transaction ends.
 */
export async function authDb<T>(
  userId: string,
  fn: (tx: typeof db) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT set_config('role', 'authenticated', true)`
    );
    await tx.execute(
      sql`SELECT set_config('request.jwt.claims', ${JSON.stringify({ sub: userId })}, true)`
    );
    return fn(tx as unknown as typeof db);
  });
}
