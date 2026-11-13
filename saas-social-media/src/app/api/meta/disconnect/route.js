import { NextResponse } from "next/server";
import { createServiceClient, getSessionContext } from "@/lib/supabase/server";

export async function POST(request) {
  const { supabase, user } = await getSessionContext();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { client_id } = await request.json().catch(() => ({}));
  const { data: client } = await supabase.from("clients").select("id").eq("id", client_id || "").maybeSingle();
  if (!client) return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });

  const { error } = await createServiceClient().from("social_accounts").delete().eq("client_id", client.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
