import { createServiceClient } from "@/lib/supabase/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Carrega os dados do portal público a partir do token secreto do cliente
export async function loadPortal(token) {
  if (!UUID_RE.test(token)) return null;
  const db = createServiceClient();
  const { data: client } = await db
    .from("clients")
    .select("id, name, instagram_handle, color, workspace_id, workspaces(name)")
    .eq("approval_token", token)
    .maybeSingle();
  if (!client) return null;

  const { data: posts } = await db
    .from("posts")
    .select("id, title, caption, format, media, status, scheduled_at, published_at")
    .eq("client_id", client.id)
    .neq("status", "draft")
    .order("scheduled_at", { ascending: true, nullsFirst: false });

  const ids = (posts || []).map((p) => p.id);
  const { data: comments } = ids.length
    ? await db.from("post_comments").select("id, post_id, author_type, author_name, body, created_at").in("post_id", ids).order("created_at")
    : { data: [] };

  return { client, posts: posts || [], comments: comments || [] };
}
