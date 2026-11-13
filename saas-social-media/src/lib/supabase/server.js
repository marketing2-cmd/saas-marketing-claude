import { createServerClient } from "@supabase/ssr";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Cliente ligado à sessão do usuário (cookies) — respeita RLS.
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Server Component não pode gravar cookie; o middleware renova a sessão.
          }
        },
      },
    }
  );
}

// Cliente com service role — IGNORA RLS. Só usar no servidor, em rotas que
// fazem a própria checagem (portal público por token, cron, OAuth da Meta).
export function createServiceClient() {
  return createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Usuário logado + workspace dele (ou null)
export async function getSessionContext() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) return { supabase, user: null, workspace: null };

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("role, workspaces(id, name)")
    .eq("user_id", claims.sub)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return {
    supabase,
    user: { id: claims.sub, email: claims.email },
    workspace: membership?.workspaces ? { ...membership.workspaces, role: membership.role } : null,
  };
}
