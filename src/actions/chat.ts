"use server";

import { eq, and, desc, sql, ilike, or } from "drizzle-orm";
import { authDb } from "@/db";
import { chatSessions, chatMessages } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

async function getUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("未登入");
  return user.id;
}

/** 建立新 session */
export async function createChatSession(title?: string) {
  const userId = await getUserId();
  return authDb(userId, async (tx) => {
    const [session] = await tx
      .insert(chatSessions)
      .values({ userId, title: title ?? "新對話" })
      .returning();
    return session;
  });
}

/** 儲存訊息 */
export async function saveChatMessage(data: {
  sessionId: string;
  role: string;
  content: string;
  toolCalls?: unknown;
}) {
  const userId = await getUserId();
  return authDb(userId, async (tx) => {
    // 驗證 session 所有權
    const [session] = await tx
      .select({ id: chatSessions.id })
      .from(chatSessions)
      .where(
        and(eq(chatSessions.id, data.sessionId), eq(chatSessions.userId, userId))
      );
    if (!session) throw new Error("Session 不存在");

    const [msg] = await tx
      .insert(chatMessages)
      .values({
        sessionId: data.sessionId,
        role: data.role,
        content: data.content,
        toolCalls: data.toolCalls ?? null,
      })
      .returning();

    // 更新 session 的 updatedAt
    await tx
      .update(chatSessions)
      .set({ updatedAt: new Date() })
      .where(eq(chatSessions.id, data.sessionId));

    return msg;
  });
}

/** 自動產生 session 標題（取 user 第一則訊息前 50 字） */
export async function updateSessionTitle(
  sessionId: string,
  title: string
) {
  const userId = await getUserId();
  await authDb(userId, (tx) =>
    tx
      .update(chatSessions)
      .set({ title: title.slice(0, 50), updatedAt: new Date() })
      .where(
        and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId))
      )
  );
}

/** 取得 session 的所有訊息 */
export async function getChatMessages(sessionId: string) {
  const userId = await getUserId();
  return authDb(userId, async (tx) => {
    // 驗證所有權
    const [session] = await tx
      .select({ id: chatSessions.id, title: chatSessions.title })
      .from(chatSessions)
      .where(
        and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId))
      );
    if (!session) throw new Error("Session 不存在");

    const messages = await tx
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(chatMessages.createdAt);

    return { session, messages };
  });
}

/** 分頁取得 session 列表，支援搜尋 */
export async function getChatSessions(params: {
  page?: number;
  pageSize?: number;
  search?: string;
}) {
  const userId = await getUserId();
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  const offset = (page - 1) * pageSize;

  return authDb(userId, async (tx) => {
    const conditions = [eq(chatSessions.userId, userId)];

    if (params.search?.trim()) {
      const keyword = `%${params.search.trim()}%`;
      // 搜尋 session 標題或訊息內容
      conditions.push(
        or(
          ilike(chatSessions.title, keyword),
          sql`EXISTS (
            SELECT 1 FROM chat_messages
            WHERE chat_messages.session_id = ${chatSessions.id}
            AND chat_messages.content ILIKE ${keyword}
          )`
        )!
      );
    }

    const where = and(...conditions);

    const [items, [{ count }]] = await Promise.all([
      tx
        .select({
          id: chatSessions.id,
          title: chatSessions.title,
          createdAt: chatSessions.createdAt,
          updatedAt: chatSessions.updatedAt,
        })
        .from(chatSessions)
        .where(where)
        .orderBy(desc(chatSessions.updatedAt))
        .limit(pageSize)
        .offset(offset),
      tx
        .select({ count: sql<number>`count(*)::int` })
        .from(chatSessions)
        .where(where),
    ]);

    return {
      items,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  });
}

/** 刪除 session（cascade 刪除訊息） */
export async function deleteChatSession(sessionId: string) {
  const userId = await getUserId();
  await authDb(userId, (tx) =>
    tx
      .delete(chatSessions)
      .where(
        and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId))
      )
  );
}
