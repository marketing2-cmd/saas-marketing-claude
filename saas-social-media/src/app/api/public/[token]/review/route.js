import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { STAGES, derivePostStatus, getAssignees, getStages, sanitizeForClient, skipEmptyStages, stagesToJson } from "@/lib/posts";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STAGE_KEYS = STAGES.map((s) => s.key);

// Portal público: o cliente aprova ou pede ajuste de UMA etapa (stage) ou de
// todas as etapas que estão "Em aprovação" (sem stage). A posse do token
// (link secreto do cliente) é a autorização.
export async function POST(request, { params }) {
  const { token } = params;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }
  const { post_id, action } = body || {};
  const stage = body?.stage || null;
  const comment = typeof body?.comment === "string" ? body.comment.trim().slice(0, 4000) : "";
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 80) : "";

  if (!UUID_RE.test(token) || !UUID_RE.test(post_id || "") || !["approve", "request_changes"].includes(action) || (stage && !STAGE_KEYS.includes(stage))) {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }
  if (action === "request_changes" && !comment) {
    return NextResponse.json({ error: "Descreva o ajuste." }, { status: 400 });
  }

  const db = createServiceClient();
  const { data: client } = await db.from("clients").select("id, workspace_id").eq("approval_token", token).maybeSingle();
  if (!client) return NextResponse.json({ error: "Link inválido." }, { status: 404 });

  const { data: post } = await db
    .from("posts")
    .select("id, status, scheduled_at, stages, updated_at, title, caption, format, media, published_at, theme, reference_links, content_text")
    .eq("id", post_id)
    .eq("client_id", client.id)
    .maybeSingle();
  if (!post) return NextResponse.json({ error: "Post não encontrado." }, { status: 404 });

  const stages = skipEmptyStages(post, getStages(post));
  const targets = stage ? [stage] : STAGE_KEYS.filter((k) => stages[k] === "in_review");
  if (!targets.length || targets.some((k) => stages[k] !== "in_review")) {
    return NextResponse.json({ error: "Esta etapa não está mais aguardando aprovação." }, { status: 409 });
  }

  const next = { ...stages };
  for (const k of targets) next[k] = action === "approve" ? "approved" : "changes_requested";
  const status = derivePostStatus(post, next);

  // Trava otimista: só grava se ninguém alterou o post desde a leitura
  const { data: updated, error } = await db
    .from("posts")
    .update({ stages: stagesToJson(next, getAssignees(post)), status, ...(status === "scheduled" ? { publish_error: null } : {}) })
    .eq("id", post.id)
    .eq("updated_at", post.updated_at)
    .select("id, status, scheduled_at, stages, title, caption, format, media, published_at, theme, reference_links, content_text")
    .maybeSingle();
  if (error) return NextResponse.json({ error: "Não foi possível salvar." }, { status: 500 });
  if (!updated) return NextResponse.json({ error: "O conteúdo foi alterado pela equipe. Recarregue a página." }, { status: 409 });

  let savedComment = null;
  if (comment) {
    const { data } = await db
      .from("post_comments")
      .insert({ post_id: post.id, workspace_id: client.workspace_id, author_type: "client", author_name: name, body: comment, stage: stage || (targets.length === 1 ? targets[0] : null) })
      .select("id, post_id, author_type, author_name, body, stage, created_at")
      .single();
    savedComment = data;
  }

  return NextResponse.json({ post: sanitizeForClient(updated), comment: savedComment });
}
