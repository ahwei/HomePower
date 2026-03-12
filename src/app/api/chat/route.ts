import {
  convertToModelMessages,
  streamText,
  stepCountIs,
  type UIMessage,
} from "ai";
import { openai } from "@ai-sdk/openai";
import { createClient } from "@/lib/supabase/server";
import { createTools } from "./tools";

export const maxDuration = 30;

const SYSTEM_PROMPT = `你是 HomePower 智慧家庭用電助理。你可以幫使用者查詢家電設備、分析用電數據、計算電費、提供節電建議。

回答規則：
- 使用繁體中文回答
- 回答要簡潔實用，善用數字和表格
- 如果需要查資料，先呼叫對應的工具再回答
- 提到金額時使用 TWD 或「元」為單位
- 提到用電量時使用 kWh 為單位
- 如果使用者問的問題跟家庭用電無關，禮貌地引導回用電相關話題
- 當比較月份用電時，主動說明夏月（6-9月）和非夏月的差異`;

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    tools: createTools(user.id),
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}
