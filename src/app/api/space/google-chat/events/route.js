import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { verifyGoogleChatRequest, parseChatEvent } from "@/lib/space/googleChat";

export const dynamic = "force-dynamic";

// Endpoint do "Chat app" do Google Chat. Recebe as mensagens enviadas ao app
// (menções em espaços ou DM) e grava no canal do space mais ligado àquele espaço.
export async function POST(request) {
  try {
    await verifyGoogleChatRequest(request);
  } catch (e) {
    console.error("[google-chat/events] requisição recusada:", e.message);
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const event = parseChatEvent(body);

  if (event.type === "ADDED_TO_SPACE") {
    return NextResponse.json({
      text: `Olá! Sou o space+. Peça a um administrador para ligar este espaço a um canal (ID: ${event.space?.name || "?"}).`,
    });
  }
  if (event.type !== "MESSAGE" || !event.message) return NextResponse.json({});

  const spaceName = event.space?.name;
  const text = (event.message.argumentText ?? event.message.text ?? "").trim();
  if (!spaceName || !text) return NextResponse.json({});

  const supabase = getSupabaseServerClient();
  const { data: integ } = await supabase
    .from("sm_channel_integrations")
    .select("channel_id")
    .eq("google_space_name", spaceName)
    .maybeSingle();

  if (!integ) {
    return NextResponse.json({ text: `Este espaço ainda não está ligado a um canal do space+. ID do espaço: ${spaceName}` });
  }

  const sender = event.message.sender || event.user || {};
  let authorId = null;
  if (sender.email) {
    const { data: m } = await supabase.from("sm_members").select("id").ilike("email", sender.email).maybeSingle();
    authorId = m?.id || null;
  }

  const { error } = await supabase.from("sm_messages").insert({
    id: crypto.randomUUID(),
    channel_id: integ.channel_id,
    author_id: authorId,
    author_name: sender.displayName || sender.email || "Google Chat",
    body: text.slice(0, 4000),
    source: "google_chat",
    created_at: event.message.createTime || new Date().toISOString(),
  });
  if (error) console.error("[google-chat/events] falha ao gravar:", error.message);

  // Resposta vazia: o app não responde no Google Chat a cada mensagem.
  return NextResponse.json({});
}
