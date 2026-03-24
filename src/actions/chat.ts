"use server";

import { createClient } from "@/lib/supabase/server";
import {
  queryCreateSession,
  querySaveChatMessage,
  queryUpdateSessionTitle,
  queryGetChatMessages,
  queryGetChatSessions,
  queryDeleteChatSession,
} from "@/queries/chat";

async function getUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("未登入");
  return { userId: user.id, supabase };
}

export async function createChatSession(title?: string) {
  const { userId, supabase } = await getUserId();
  return queryCreateSession(supabase, userId, title);
}

export async function saveChatMessage(data: {
  sessionId: string;
  role: string;
  content: string;
  toolCalls?: unknown;
}) {
  const { userId, supabase } = await getUserId();
  return querySaveChatMessage(supabase, userId, data);
}

export async function updateSessionTitle(sessionId: string, title: string) {
  const { userId, supabase } = await getUserId();
  return queryUpdateSessionTitle(supabase, userId, sessionId, title);
}

export async function getChatMessages(sessionId: string) {
  const { userId, supabase } = await getUserId();
  return queryGetChatMessages(supabase, userId, sessionId);
}

export async function getChatSessions(params: {
  page?: number;
  pageSize?: number;
  search?: string;
}) {
  const { userId, supabase } = await getUserId();
  return queryGetChatSessions(supabase, userId, params);
}

export async function deleteChatSession(sessionId: string) {
  const { userId, supabase } = await getUserId();
  return queryDeleteChatSession(supabase, userId, sessionId);
}
