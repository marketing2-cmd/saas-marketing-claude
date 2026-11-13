import { createBrowserClient } from "@supabase/ssr";

// Cliente para componentes "use client". Publishable key + RLS.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}
