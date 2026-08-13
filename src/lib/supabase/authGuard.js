import { createClient } from "@/lib/supabase/server";

// Usado em Server Components (páginas) e Route Handlers para saber quem está
// logado e qual o status de aprovação dele. Lê a sessão pelos cookies e busca
// o profile com o próprio cliente do usuário (RLS: "profiles_select_own"/"profiles_select_admin").
export async function getAuthContext() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims) return { user: null, profile: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, status, role")
    .eq("id", claims.sub)
    .maybeSingle();

  return { user: claims, profile };
}

export async function requireApprovedUser() {
  const { user, profile } = await getAuthContext();
  if (!user) return { error: "Não autenticado.", status: 401 };
  if (!profile || (profile.status !== "approved" && profile.role !== "admin")) {
    return { error: "Sua conta ainda não foi aprovada pelo administrador.", status: 403 };
  }
  return { user, profile };
}

export async function requireAdmin() {
  const ctx = await requireApprovedUser();
  if (ctx.error) return ctx;
  if (ctx.profile.role !== "admin") return { error: "Apenas administradores podem fazer isso.", status: 403 };
  return ctx;
}
