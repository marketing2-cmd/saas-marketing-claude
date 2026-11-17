import { createServiceClient } from "@/lib/supabase/server";
import { CLIENT_VISIBLE_STAGE, getStages, sanitizeForClient } from "@/lib/posts";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Carrega os dados do portal público a partir do token secreto do cliente
export async function loadPortal(token) {
  if (!UUID_RE.test(token)) return null;
  const db = createServiceClient();
  const { data: client } = await db
    .from("clients")
    .select("id, name, instagram_handle, color, avatar_url, cover_url, workspace_id, workspaces(name)")
    .eq("approval_token", token)
    .maybeSingle();
  if (!client) return null;

  const { data: posts } = await db
    .from("posts")
    .select("id, title, caption, format, media, status, scheduled_at, published_at, theme, reference_links, content_text, stages")
    .eq("client_id", client.id)
    .order("scheduled_at", { ascending: true, nullsFirst: false });

  const ids = (posts || []).map((p) => p.id);
  const { data: comments } = ids.length
    ? await db.from("post_comments").select("id, post_id, author_type, author_name, body, stage, created_at").in("post_id", ids).order("created_at")
    : { data: [] };

  // Só posts com alguma etapa visível; o conteúdo de etapas em rascunho é removido
  const visible = (posts || [])
    .filter((p) => Object.values(getStages(p)).some((st) => CLIENT_VISIBLE_STAGE.has(st)))
    .map(sanitizeForClient);
  const ids2 = new Set(visible.map((p) => p.id));

  // Planejamento: só as seções liberadas pela equipe ("shared")
  const { data: strategy } = await db.from("client_strategy").select("*").eq("client_id", client.id).maybeSingle();
  const vis = strategy?.section_visibility || {};
  const shared = {};
  if (strategy) {
    if (vis.diagnosis === "shared") shared.diagnosis = strategy.diagnosis || {};
    if (vis.persona === "shared") shared.personas = strategy.personas || [];
    if (vis.competitors === "shared") shared.competitors = strategy.competitors || [];
    if (vis.positioning === "shared") {
      shared.positioning = {
        value_proposition: strategy.value_proposition,
        differentials: strategy.differentials,
        goals: strategy.goals,
        audience: strategy.audience,
        tone: strategy.tone,
        dos: strategy.dos,
        donts: strategy.donts,
        pillars: strategy.pillars || [],
      };
    }
    if (vis.products === "shared") shared.products = strategy.products || [];
    if (vis.schedule === "shared") {
      const now = new Date();
      const months = [0, 1, 2].map((d) => {
        const m = new Date(now.getFullYear(), now.getMonth() + d, 1);
        return `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}-01`;
      });
      const { data: plans } = await db
        .from("client_monthly_plans")
        .select("month, theme, goals, weeks, key_dates")
        .eq("client_id", client.id)
        .in("month", months)
        .order("month");
      shared.schedule = { weekly: strategy.weekly_schedule || [], pillars: strategy.pillars || [], monthly: plans || [] };
    }
  }

  return { client, posts: visible, comments: (comments || []).filter((c) => ids2.has(c.post_id)), shared };
}
