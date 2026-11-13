import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { statusAfterApproval } from "@/lib/posts";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Portal público: o cliente aprova ou pede ajuste. A posse do token
// (link secreto do cliente) é a autorização; o post precisa ser desse cliente
// e estar "Em aprovação".
export async function POST(request, { params }) {
  const { token } = params;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }
  const { post_id, action } = body || {};
  const comment = typeof body?.comment === "string" ? body.comment.trim().slice(0, 4000) : "";
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 80) : "";

  if (!UUID_RE.test(token) || !UUID_RE.test(post_id || "") || !["approve", "request_changes"].includes(action)) {
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
    .select("id, status, scheduled_at")
    .eq("id", post_id)
    .eq("client_id", client.id)
    .maybeSingle();
  if (!post) return NextResponse.json({ error: "Post não encontrado." }, { status: 404 });
  if (post.status !== "in_review") {
    return NextResponse.json({ error: "Este post não está mais aguardando aprovação." }, { status: 409 });
  }

  const status = action === "approve" ? statusAfterApproval(post) : "changes_requested";
  const { error } = await db.from("posts").update({ status, publish_error: null }).eq("id", post.id).eq("status", "in_review");
  if (error) return NextResponse.json({ error: "Não foi possível salvar." }, { status: 500 });

  let savedComment = null;
  if (comment) {
    const { data } = await db
      .from("post_comments")
      .insert({ post_id: post.id, workspace_id: client.workspace_id, author_type: "client", author_name: name, body: comment })
      .select("id, post_id, author_type, author_name, body, created_at")
      .single();
    savedComment = data;
  }

  return NextResponse.json({ status, comment: savedComment });
}
