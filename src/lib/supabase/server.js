import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Cliente Supabase vinculado à sessão do usuário (cookies), para Server Components
// e Route Handlers. Usa a publishable key + RLS — diferente de src/lib/supabaseServer.js,
// que usa a service role key e ignora RLS por completo.
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
            // Chamado a partir de um Server Component, que não pode escrever cookies.
            // Sem problema: o middleware já cuida de renovar a sessão a cada request.
          }
        },
      },
    }
  );
}
