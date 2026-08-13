import { createBrowserClient } from "@supabase/ssr";

// Cliente Supabase para uso em componentes "use client" (formulários de login/signup).
// Usa a publishable key — segura para expor ao navegador, RLS decide o que cada
// usuário autenticado pode ver/alterar.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}
