import { NextResponse } from "next/server";
import { requireApprovedUser } from "@/lib/supabase/authGuard";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { postToGoogleChat } from "@/lib/space/googleChat";

export const dynamic = "force-dynamic";

// Grava a mensagem no chat interno e, se o canal estiver ligado a um espaço do
// Google Chat, repassa para lá. A falha no Google Chat não perde a mensagem.
export async function POST(request) {
  const auth = await requireApprovedUser();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id, channelId, body } = await request.json().catch(() => ({}));
  const text = typeof body === "string" ? body.trim() : "";
  if (!channelId || !text) return NextResponse.json({ error: "Mensagem vazia." }, { status: 400 });
  if (text.length > 4000) return NextResponse.json({ error: "Mensagem muito longa (máx. 4000 caracteres)." }, { status: 400 });

  try {
    const supabase = getSupabaseServerClient();
    const { data: member } = await supabase.from("sm_members").select("name").eq("id", auth.user.sub).maybeSingle();
    const authorName = member?.name || auth.profile.email;

    const { error } = await supabase.from("sm_messages").insert({
      id: typeof id === "string" && id.length <= 64 ? id : crypto.randomUUID(),
      channel_id: channelId,
      author_id: auth.user.sub,
      author_name: authorName,
      body: text,
      source: "space",
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const { data: integration } = await supabase
      .from("sm_channel_integrations")
      .select("google_webhook_url")
      .eq("channel_id", channelId)
      .maybeSingle();

    let forwarded = false;
    if (integration?.google_webhook_url) {
      try {
        await postToGoogleChat(integration.google_webhook_url, `*${authorName}* (SpaceMais): ${text}`);
        forwarded = true;
      } catch (e) {
        console.error("[space/chat/send] falha ao repassar ao Google Chat:", e.message);
      }
    }
    return NextResponse.json({ ok: true, forwarded });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
