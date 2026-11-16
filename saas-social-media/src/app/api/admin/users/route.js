import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATUS_BY_ACTION = { approve: "approved", reject: "rejected", reset: "pending" };

async function requireAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return { error: NextResponse.json({ error: "Não autenticado." }, { status: 401 }) };
  const { data: profile } = await supabase.from("platform_profiles").select("is_admin").eq("id", userId).maybeSingle();
  if (!profile?.is_admin) return { error: NextResponse.json({ error: "Apenas administradores." }, { status: 403 }) };
  return { userId };
}

// Aprova, recusa ou volta para análise um cadastro
export async function POST(request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { user_id, action } = await request.json().catch(() => ({}));
  const status = STATUS_BY_ACTION[action];
  if (!UUID_RE.test(user_id || "") || !status) {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }
  if (user_id === auth.userId) {
    return NextResponse.json({ error: "Você não pode alterar o próprio acesso." }, { status: 400 });
  }

  const { data, error } = await createServiceClient()
    .from("platform_profiles")
    .update({ status, reviewed_at: new Date().toISOString() })
    .eq("id", user_id)
    .eq("is_admin", false)
    .select("id, email, full_name, status, is_admin, created_at, reviewed_at")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  return NextResponse.json({ profile: data });
}
