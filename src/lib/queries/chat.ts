import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type Supabase = SupabaseClient<Database>;

/** 建立新 session */
export async function queryCreateSession(
  supabase: Supabase,
  userId: string,
  title?: string
) {
  const { data, error } = await supabase
    .from("chat_sessions")
    .insert({ user_id: userId, title: title ?? "新對話" })
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    userId: data.user_id,
    title: data.title,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/** 儲存訊息 */
export async function querySaveChatMessage(
  supabase: Supabase,
  userId: string,
  data: {
    sessionId: string;
    role: string;
    content: string;
    toolCalls?: unknown;
  }
) {
  // 驗證 session 所有權
  const { data: session, error: sessionErr } = await supabase
    .from("chat_sessions")
    .select("id")
    .eq("id", data.sessionId)
    .eq("user_id", userId)
    .single();

  if (sessionErr || !session) throw new Error("Session 不存在");

  const { data: msg, error } = await supabase
    .from("chat_messages")
    .insert({
      session_id: data.sessionId,
      role: data.role,
      content: data.content,
      tool_calls: (data.toolCalls as Database["public"]["Tables"]["chat_messages"]["Insert"]["tool_calls"]) ?? null,
    })
    .select()
    .single();

  if (error) throw error;

  // 更新 session 的 updatedAt
  await supabase
    .from("chat_sessions")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", data.sessionId);

  return {
    id: msg.id,
    sessionId: msg.session_id,
    role: msg.role,
    content: msg.content,
    toolCalls: msg.tool_calls,
    createdAt: msg.created_at,
  };
}

/** 更新 session 標題 */
export async function queryUpdateSessionTitle(
  supabase: Supabase,
  userId: string,
  sessionId: string,
  title: string
) {
  const { error } = await supabase
    .from("chat_sessions")
    .update({ title: title.slice(0, 50), updated_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("user_id", userId);

  if (error) throw error;
}

/** 取得 session 的所有訊息 */
export async function queryGetChatMessages(
  supabase: Supabase,
  userId: string,
  sessionId: string
) {
  // 驗證所有權
  const { data: session, error: sessionErr } = await supabase
    .from("chat_sessions")
    .select("id, title")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .single();

  if (sessionErr || !session) throw new Error("Session 不存在");

  const { data: messages, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at");

  if (error) throw error;

  return {
    session,
    messages: (messages ?? []).map((m) => ({
      id: m.id,
      sessionId: m.session_id,
      role: m.role,
      content: m.content,
      toolCalls: m.tool_calls,
      createdAt: m.created_at,
    })),
  };
}

/** 分頁取得 session 列表（含搜尋） */
export async function queryGetChatSessions(
  supabase: Supabase,
  userId: string,
  params: { page?: number; pageSize?: number; search?: string }
) {
  const { data, error } = await supabase.rpc("get_chat_sessions", {
    p_user_id: userId,
    p_search: params.search?.trim() || null,
    p_page: params.page ?? 1,
    p_page_size: params.pageSize ?? 10,
  });

  if (error) throw error;

  const result = data as unknown as {
    items: Array<{
      id: string;
      title: string;
      created_at: string;
      updated_at: string;
    }>;
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };

  return {
    items: (result.items ?? []).map((s) => ({
      id: s.id,
      title: s.title,
      createdAt: new Date(s.created_at),
      updatedAt: new Date(s.updated_at),
    })),
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    totalPages: result.totalPages,
  };
}

/** 刪除 session（cascade 刪除訊息） */
export async function queryDeleteChatSession(
  supabase: Supabase,
  userId: string,
  sessionId: string
) {
  const { error } = await supabase
    .from("chat_sessions")
    .delete()
    .eq("id", sessionId)
    .eq("user_id", userId);

  if (error) throw error;
}
