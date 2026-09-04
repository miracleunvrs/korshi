import { createHash } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const runtime = "nodejs";

const windows = new Map<string, { count: number; resetAt: number }>();
const allowedTasks = new Set(["request_triage", "image_analysis", "similar_requests", "discussion_summary", "document_qa", "translate", "decision_draft", "meeting_protocol", "monthly_summary", "overdue_detection", "moderation"]);

function limited(key: string) {
  const now = Date.now();
  const current = windows.get(key);
  if (!current || current.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  current.count += 1;
  return current.count > 10;
}

function extractOutputText(payload: any) {
  if (typeof payload.output_text === "string") return payload.output_text;
  for (const item of payload.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && typeof content.text === "string") return content.text;
    }
  }
  return "";
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL;
  if (!apiKey || !model) {
    return Response.json({ error: "AI не настроен. Добавьте OPENAI_API_KEY и OPENAI_MODEL на сервере." }, { status: 503 });
  }

  let userId = "demo-user";
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return Response.json({ error: "Нужна авторизация" }, { status: 401 });
    userId = data.user.id;
  }

  const safetyIdentifier = createHash("sha256").update(userId).digest("hex").slice(0, 32);
  if (limited(safetyIdentifier)) return Response.json({ error: "Слишком много запросов. Повторите через минуту." }, { status: 429 });

  const body = await request.json().catch(() => null) as null | { task?: string; prompt?: string; imageDataUrl?: string; sources?: Array<{ id: string; title: string; excerpt: string }> };
  if (!body?.task || !allowedTasks.has(body.task) || !body.prompt?.trim()) return Response.json({ error: "Некорректный AI-запрос" }, { status: 400 });
  if (body.prompt.length > 12_000) return Response.json({ error: "Текст длиннее 12 000 символов" }, { status: 413 });
  if (body.imageDataUrl && (!body.imageDataUrl.startsWith("data:image/") || body.imageDataUrl.length > 7_000_000)) return Response.json({ error: "Изображение слишком большое или имеет неверный формат" }, { status: 413 });

  const sourceText = (body.sources || []).slice(0, 12).map((source) => `[${source.id}] ${source.title}: ${source.excerpt}`).join("\n");
  const content: Array<Record<string, unknown>> = [{ type: "input_text", text: `${body.prompt.trim()}${sourceText ? `\n\nДоступные источники:\n${sourceText}` : ""}` }];
  if (body.imageDataUrl) content.push({ type: "input_image", image_url: body.imageDataUrl, detail: "auto" });

  const upstream = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      store: false,
      safety_identifier: safetyIdentifier,
      max_output_tokens: 900,
      instructions: "Ты помощник цифрового сервиса жилого комплекса Казахстана. Отвечай по-русски, кратко и проверяемо. Не выдумывай факты. Для document_qa используй только переданные источники и указывай их id. Для аварийных или юридически значимых решений явно требуй проверки человеком. Верни JSON строго по схеме.",
      input: [{ role: "user", content }],
      text: {
        format: {
          type: "json_schema",
          name: "korshi_ai_result",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              title: { type: "string" },
              answer: { type: "string" },
              category: { type: ["string", "null"] },
              priority: { type: ["string", "null"] },
              suggested_duplicates: { type: "array", items: { type: "string" } },
              citations: { type: "array", items: { type: "string" } },
              needs_human_review: { type: "boolean" },
            },
            required: ["title", "answer", "category", "priority", "suggested_duplicates", "citations", "needs_human_review"],
          },
        },
      },
      metadata: { feature: body.task },
    }),
  });

  const payload = await upstream.json().catch(() => ({}));
  if (!upstream.ok) return Response.json({ error: "AI-провайдер временно недоступен", detail: payload?.error?.message }, { status: upstream.status });

  const outputText = extractOutputText(payload);
  try {
    return Response.json({ id: payload.id, result: JSON.parse(outputText) });
  } catch {
    return Response.json({ error: "AI вернул ответ в неожиданном формате" }, { status: 502 });
  }
}
