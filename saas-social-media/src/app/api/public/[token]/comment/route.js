import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { CLIENT_VISIBLE_STAGE, STAGES, getStages } from "@/lib/posts";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STAGE_KEYS = STAGES.map((s) => s.key);

// Portal: o cliente deixa uma mensagem para a equipe em um post (sem aprovar/recusar)
export async function POST(request, { params }) {
  const { token } = params;
  const body = await request.json().catch(() => null);
  const text = typeof body?.body === "string" ? body.body.trim().slice(0, 4000) : "";
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 80) : "";
  const stage = body?.stage || null;
  if (!UUID_RE.test(token) || !UUID_RE.test(body?.post_id || "") || !text || (stage && !STAGE_KEYS.includes(stage))) {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const db = createServiceClient();
  const { data: client } = await db.from("clients").select("id, workspace_id").eq("approval_token", token).maybeSingle();
  if (!client) return NextResponse.json({ error: "Link inválido." }, { status: 404 });

  const { data: post } = await db.from("posts").select("id, status, stages").eq("id", body.post_id).eq("client_id", client.id).maybeSingle();
  // Só posts que o cliente consegue ver (alguma etapa fora do rascunho)
  if (!post || !Object.values(getStages(post)).some((s) => CLIENT_VISIBLE_STAGE.has(s))) {
    return NextResponse.json({ error: "Post não encontrado." }, { status: 404 });
  }

  const { data, error } = await db
    .from("post_comments")
    .insert({ post_id: post.id, workspace_id: client.workspace_id, author_type: "client", author_name: name, body: text, stage })
    .select("id, post_id, author_type, author_name, body, stage, created_at")
    .single();
  if (error) return NextResponse.json({ error: "Não foi possível enviar." }, { status: 500 });
  return NextResponse.json({ comment: data });
}
