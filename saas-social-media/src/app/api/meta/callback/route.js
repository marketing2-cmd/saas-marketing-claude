import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServiceClient, getSessionContext } from "@/lib/supabase/server";
import { exchangeCodeForLongLivedToken, listInstagramAccounts } from "@/lib/meta";

export async function GET(request) {
  const params = request.nextUrl.searchParams;
  const cookieStore = await cookies();
  let saved = null;
  try {
    saved = JSON.parse(cookieStore.get("meta_oauth")?.value || "null");
  } catch {}
  cookieStore.delete({ name: "meta_oauth", path: "/api/meta" });

  const clientId = saved?.client_id;
  const fail = (msg) => {
    const url = new URL(clientId ? `/clientes/${clientId}` : "/clientes", request.url);
    url.searchParams.set("meta_error", msg);
    return NextResponse.redirect(url);
  };

  if (!saved || params.get("state") !== saved.state) return fail("sessão de conexão expirada. Tente de novo.");
  if (params.get("error")) return fail(params.get("error_description") || "autorização cancelada.");

  const { supabase, user } = await getSessionContext();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const { data: client } = await supabase
    .from("clients")
    .select("id, workspace_id, instagram_handle")
    .eq("id", clientId)
    .maybeSingle();
  if (!client) return fail("cliente não encontrado.");

  try {
    const userToken = await exchangeCodeForLongLivedToken(params.get("code"));
    const accounts = await listInstagramAccounts(userToken);
    if (!accounts.length) {
      return fail("nenhuma conta profissional do Instagram vinculada a uma Página do Facebook foi encontrada.");
    }
    const wanted = client.instagram_handle?.replace(/^@/, "").toLowerCase();
    const account = accounts.find((a) => a.username?.toLowerCase() === wanted) || accounts[0];

    const db = createServiceClient();
    const { error } = await db.from("social_accounts").upsert(
      {
        workspace_id: client.workspace_id,
        client_id: client.id,
        provider: "instagram",
        external_user_id: account.ig_user_id,
        page_id: account.page_id,
        username: account.username,
        access_token: account.page_token,
        token_expires_at: null,
      },
      { onConflict: "client_id,provider" }
    );
    if (error) return fail("não foi possível salvar a conexão.");

    const url = new URL(`/clientes/${client.id}`, request.url);
    url.searchParams.set("connected", "1");
    return NextResponse.redirect(url);
  } catch (e) {
    return fail(e.message);
  }
}
