import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_REST_API_KEY;
  if (!appId || !apiKey) {
    return NextResponse.json({ error: "OneSignal не настроен на сервере" }, { status: 503 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "HouseSM";
  const message = typeof body?.message === "string" ? body.message.trim() : "Новое уведомление";
  if (!message || message.length > 500) {
    return NextResponse.json({ error: "Некорректный текст уведомления" }, { status: 400 });
  }

  const response = await fetch("https://api.onesignal.com/notifications", {
    method: "POST",
    headers: {
      Authorization: `Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      app_id: appId,
      target_channel: "push",
      include_aliases: { external_id: [user.id] },
      headings: { en: title },
      contents: { en: message },
      ...(typeof body?.url === "string" && body.url.startsWith("/") ? { url: body.url } : {}),
    }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) return NextResponse.json({ error: "OneSignal отклонил уведомление", details: result }, { status: 502 });
  return NextResponse.json({ ok: true, id: result.id ?? null });
}
