import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { publishToInstagram } from "@/lib/meta";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_ATTEMPTS = 3;
const MAX_PROCESSING_MINUTES = 30; // vídeo ainda processando na Meta: espera até 30 min
const BATCH = 5;

// Publica os posts com status "scheduled" cujo horário já chegou.
// Chamado a cada minuto (Vercel Cron, Supabase pg_cron ou qualquer agendador)
// com o header  Authorization: Bearer <CRON_SECRET>.
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const db = createServiceClient();
  const now = new Date().toISOString();

  // Posts travados em "publishing" há mais de 15 min (execução interrompida)
  const stale = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  await db
    .from("posts")
    .update({ status: "failed", publish_error: "A publicação foi interrompida. Confira no Instagram se o post saiu antes de tentar de novo." })
    .eq("status", "publishing")
    .lt("updated_at", stale);

  const { data: due } = await db
    .from("posts")
    .select("id")
    .eq("status", "scheduled")
    .lte("scheduled_at", now)
    .order("scheduled_at")
    .limit(BATCH);

  const results = [];
  for (const { id } of due || []) {
    // Trava atômica: só um processo consegue passar de scheduled → publishing
    const { data: post } = await db
      .from("posts")
      .update({ status: "publishing" })
      .eq("id", id)
      .eq("status", "scheduled")
      .select("*")
      .maybeSingle();
    if (!post) continue;
    results.push(await publish(db, post));
  }

  return NextResponse.json({ processed: results.length, results });
}

async function publish(db, post) {
  const attempts = post.publish_attempts + 1;
  try {
    if (!post.networks.includes("instagram")) throw Object.assign(new Error("Nenhuma rede suportada selecionada."), { retryable: false });

    const { data: account } = await db
      .from("social_accounts")
      .select("external_user_id, access_token")
      .eq("client_id", post.client_id)
      .eq("provider", "instagram")
      .maybeSingle();
    if (!account) throw Object.assign(new Error("Instagram do cliente não está conectado."), { retryable: false });

    const externalId = await publishToInstagram({
      igUserId: account.external_user_id,
      token: account.access_token,
      post,
      containerId: post.publish_container_id,
      onContainer: (id) =>
        db.from("posts").update({ publish_container_id: id, publish_container_at: new Date().toISOString() }).eq("id", post.id),
    });

    await db
      .from("posts")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
        external_id: externalId,
        publish_error: null,
        publish_attempts: attempts,
        publish_container_id: null,
        publish_container_at: null,
      })
      .eq("id", post.id);
    return { id: post.id, ok: true };
  } catch (e) {
    // Vídeo ainda processando: volta para a fila sem gastar tentativa,
    // até o limite de tempo; depois disso, falha
    if (e.processing) {
      const { data: fresh } = await db.from("posts").select("publish_container_at").eq("id", post.id).maybeSingle();
      const since = fresh?.publish_container_at ? (Date.now() - new Date(fresh.publish_container_at).getTime()) / 60000 : 0;
      if (since < MAX_PROCESSING_MINUTES) {
        await db.from("posts").update({ status: "scheduled", publish_error: e.message }).eq("id", post.id);
        return { id: post.id, ok: false, error: e.message, retry: true, processing: true };
      }
      e.message = "O Instagram não terminou de processar o vídeo em 30 minutos. Confira o arquivo (formato, duração e tamanho) e tente de novo.";
      e.retryable = false;
    }
    const retry = e.retryable && attempts < MAX_ATTEMPTS;
    await db
      .from("posts")
      .update({
        status: retry ? "scheduled" : "failed",
        publish_error: e.message,
        publish_attempts: attempts,
        ...(retry ? {} : { publish_container_id: null, publish_container_at: null }),
      })
      .eq("id", post.id);
    return { id: post.id, ok: false, error: e.message, retry };
  }
}
