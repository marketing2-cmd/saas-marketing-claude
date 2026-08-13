import { createClient } from "@supabase/supabase-js";

let client = null;

export function getSupabaseServerClient() {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar configurados nas variáveis de ambiente do servidor."
    );
  }

  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}
