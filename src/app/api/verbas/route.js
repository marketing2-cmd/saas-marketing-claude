import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireApprovedUser } from "@/lib/supabase/authGuard";

// Backend do módulo Verbas (public/verbas.html). Usa a sessão do usuário
// (publishable key), então as policies de RLS de public.verbas_docs decidem
// quem lê e quem grava cada coleção — ver supabase/verbas.sql.

export const dynamic = "force-dynamic";

const COLLECTIONS = new Set(["fornecedores", "ciclos", "verbas", "campanhas", "equipe", "pedidos", "historico"]);
const ID_RE = /^[A-Za-z0-9_.:@+~-]{1,200}$/;
const MAX_BYTES = 256 * 1024;
const HIST_LIMIT = 500;

function json(body, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

// Mesma semântica do update() do artefato: objetos aninhados se fundem,
// qualquer outro valor (inclusive arrays e null) substitui o campo.
function deepMerge(base, patch) {
  const out = { ...(isPlainObject(base) ? base : {}) };
  for (const [k, v] of Object.entries(patch)) {
    out[k] = isPlainObject(v) && isPlainObject(out[k]) ? deepMerge(out[k], v) : v;
  }
  return out;
}

export async function GET() {
  const auth = await requireApprovedUser();
  if (auth.error) return json({ error: auth.error }, auth.status);
  const supabase = await createClient();

  const [main, hist, people] = await Promise.all([
    supabase.from("verbas_docs").select("collection, id, data").neq("collection", "historico").limit(10000),
    supabase.from("verbas_docs").select("collection, id, data").eq("collection", "historico")
      .order("updated_at", { ascending: false }).limit(HIST_LIMIT),
    supabase.rpc("verbas_people"),
  ]);
  const err = main.error || hist.error || people.error;
  if (err) return json({ error: "Não foi possível carregar os dados." }, 500);

  return json({
    me: { id: auth.profile.id, email: auth.profile.email, isAdmin: auth.profile.role === "admin" },
    people: people.data || [],
    docs: [...main.data, ...hist.data],
  });
}

export async function POST(request) {
  const auth = await requireApprovedUser();
  if (auth.error) return json({ error: auth.error }, auth.status);

  let body;
  try { body = await request.json(); } catch { return json({ error: "Requisição inválida." }, 400); }
  const { op, collection, id, data } = body || {};
  if (!["set", "update", "delete"].includes(op)) return json({ error: "Operação inválida." }, 400);
  if (!COLLECTIONS.has(collection) || typeof id !== "string" || !ID_RE.test(id)) return json({ error: "Caminho inválido." }, 400);
  if (op !== "delete") {
    if (!isPlainObject(data)) return json({ error: "Dados inválidos." }, 400);
    if (JSON.stringify(data).length > MAX_BYTES) return json({ error: "Documento grande demais." }, 413);
  }

  const supabase = await createClient();

  if (op === "delete") {
    const { error } = await supabase.from("verbas_docs").delete().eq("collection", collection).eq("id", id);
    if (error) return json({ error: "Sem permissão para esta alteração." }, 403);
    return json({ ok: true });
  }

  let next = data;
  if (op === "update") {
    const { data: row, error } = await supabase.from("verbas_docs").select("data").eq("collection", collection).eq("id", id).maybeSingle();
    if (error) return json({ error: "Não foi possível ler o documento." }, 500);
    if (!row) return json({ error: "Documento não encontrado." }, 404);
    next = deepMerge(row.data, data);
  }

  const { error } = await supabase.from("verbas_docs").upsert(
    { collection, id, data: next, updated_at: new Date().toISOString(), updated_by: auth.profile.id },
    { onConflict: "collection,id" }
  );
  // Recusa por RLS chega como erro 42501 (ou nenhuma linha afetada) — tratamos como falta de permissão.
  if (error) return json({ error: "Sem permissão para esta alteração." }, 403);
  return json({ ok: true });
}
