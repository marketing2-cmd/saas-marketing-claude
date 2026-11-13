import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionContext } from "@/lib/supabase/server";
import { metaAuthUrl } from "@/lib/meta";

// Início do OAuth: /api/meta/connect?client_id=<uuid>
export async function GET(request) {
  const clientId = request.nextUrl.searchParams.get("client_id");
  const { supabase, user } = await getSessionContext();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  if (!process.env.META_APP_ID || !process.env.META_APP_SECRET || !process.env.NEXT_PUBLIC_APP_URL) {
    return backToClient(request, clientId, "o app da Meta ainda não foi configurado (META_APP_ID / META_APP_SECRET / NEXT_PUBLIC_APP_URL).");
  }

  // RLS: só encontra o cliente se o usuário for membro do workspace dele
  const { data: client } = await supabase.from("clients").select("id").eq("id", clientId).maybeSingle();
  if (!client) return NextResponse.redirect(new URL("/clientes", request.url));

  const state = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set("meta_oauth", JSON.stringify({ state, client_id: client.id }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/api/meta",
  });

  return NextResponse.redirect(metaAuthUrl(state));
}

function backToClient(request, clientId, message) {
  const url = new URL(clientId ? `/clientes/${clientId}` : "/clientes", request.url);
  url.searchParams.set("meta_error", message);
  return NextResponse.redirect(url);
}
