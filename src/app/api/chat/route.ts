import { createClient } from "@/lib/supabase/server";
import { openai } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { DEFAULT_OPENAI_MODEL } from "@/constants/ai";
import { createTools } from "./tools";

export const maxDuration = 30;

function getSystemPrompt() {
  const today = new Date().toISOString().slice(0, 10);
  return `你是 HomePower 智慧家庭用電助理。你可以幫使用者查詢家電設備、分析用電數據、計算電費、提供節電建議。

今天日期：${today}

回答規則：
- 使用繁體中文回答
- 回答要簡潔實用，善用數字和表格
- 如果需要查資料，先呼叫對應的工具再回答
- 提到金額時使用 TWD 或「元」為單位
- 提到用電量時使用 kWh 為單位
- 如果使用者問的問題跟家庭用電無關，禮貌地引導回用電相關話題
- 當比較月份用電時，主動說明夏月（6-9月）和非夏月的差異
- 使用者說「上個月」「這個月」等相對時間時，根據今天日期推算正確的年月
- 設備圖片會由前端自動顯示，回覆中不要輸出圖片 URL 或連結`;
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages, sessionId }: { messages: UIMessage[]; sessionId?: string } =
    await req.json();

  const result = streamText({
    model: openai(process.env.OPENAI_MODEL ?? DEFAULT_OPENAI_MODEL),
    system: getSystemPrompt(),
    messages: await convertToModelMessages(messages),
    tools: createTools(supabase, user.id),
    stopWhen: stepCountIs(5),
    async onFinish({ text }) {
      if (!sessionId) return;

      try {
        // 存 user 最後一則訊息
        const lastUserMsg = messages.filter((m) => m.role === "user").pop();
        if (lastUserMsg) {
          const userText =
            lastUserMsg.parts
              ?.filter(
                (p): p is { type: "text"; text: string } => p.type === "text",
              )
              .map((p) => p.text)
              .join("") ?? "";
          if (userText) {
            await supabase.from("chat_messages").insert({
              session_id: sessionId,
              role: "user",
              content: userText,
            });
          }
        }

        // 存 assistant 回覆
        if (text) {
          await supabase.from("chat_messages").insert({
            session_id: sessionId,
            role: "assistant",
            content: text,
          });
        }

        // 更新 session updatedAt
        await supabase
          .from("chat_sessions")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", sessionId);
      } catch (error) {
        console.error("Failed to save chat messages:", error);
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
