import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/authGuard";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { isGoogleChatWebhookUrl } from "@/lib/space/googleChat";

export const dynamic = "force-dynamic";

// Lê/grava a ligação de um canal com um espaço do Google Chat. Só admin:
// a URL do webhook contém a chave de envio do espaço.
export async function GET(request) {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const channelId = new URL(request.url).searchParams.get("channelId");
  if (!channelId) return NextResponse.json({ error: "channelId é obrigatório." }, { status: 400 });

  const supabase = getSupabaseServerClient();
  const [{ data: integ }, { data: channel }] = await Promise.all([
    supabase.from("sm_channel_integrations").select("*").eq("channel_id", channelId).maybeSingle(),
    supabase.from("sm_channels").select("google_space_label").eq("id", channelId).maybeSingle(),
  ]);
  return NextResponse.json({
    integration: {
      googleWebhookUrl: integ?.google_webhook_url || "",
      googleSpaceName: integ?.google_space_name || "",
      label: channel?.google_space_label || "",
    },
  });
}

export async function POST(request) {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { channelId, googleWebhookUrl = "", googleSpaceName = "", label = "" } = await request.json().catch(() => ({}));
  if (!channelId) return NextResponse.json({ error: "channelId é obrigatório." }, { status: 400 });
  const webhook = googleWebhookUrl.trim();
  const space = googleSpaceName.trim().replace(/^.*\/room\//, "spaces/");
  if (webhook && !isGoogleChatWebhookUrl(webhook))
    return NextResponse.json({ error: "A URL do webhook deve começar com https://chat.googleapis.com/v1/spaces/" }, { status: 400 });
  if (space && !/^spaces\/[A-Za-z0-9_-]+$/.test(space))
    return NextResponse.json({ error: "O ID do espaço deve ter o formato spaces/AAAA…" }, { status: 400 });

  const supabase = getSupabaseServerClient();
  const connected = Boolean(webhook || space);
  const { error } = await supabase.from("sm_channel_integrations").upsert({
    channel_id: channelId,
    google_webhook_url: webhook,
    google_space_name: space,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    const msg = error.code === "23505" ? "Esse espaço do Google Chat já está ligado a outro canal." : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  await supabase
    .from("sm_channels")
    .update({ google_space_label: connected ? label.trim() || "Google Chat" : "" })
    .eq("id", channelId);
  return NextResponse.json({ ok: true });
}
