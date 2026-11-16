import { NextResponse } from "next/server";
import { createServiceClient, getSessionContext } from "@/lib/supabase/server";
import { getInstagramReport } from "@/lib/meta";
import { MAX_RANGE_DAYS, parseRange } from "@/lib/reports";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// GET /api/reports/instagram?client_id=<uuid>&since=YYYY-MM-DD&until=YYYY-MM-DD (until inclusivo)
export async function GET(request) {
  const { supabase, user } = await getSessionContext();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const params = request.nextUrl.searchParams;
  const range = parseRange(params.get("since"), params.get("until"));
  if (!range) {
    return NextResponse.json({ error: `Período inválido. Escolha até ${MAX_RANGE_DAYS} dias, sem datas futuras.` }, { status: 400 });
  }

  // RLS: só encontra o cliente se o usuário for membro aprovado do workspace
  const { data: client } = await supabase.from("clients").select("id").eq("id", params.get("client_id") || "").maybeSingle();
  if (!client) return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });

  const { data: account } = await createServiceClient()
    .from("social_accounts")
    .select("external_user_id, access_token")
    .eq("client_id", client.id)
    .eq("provider", "instagram")
    .maybeSingle();
  if (!account) return NextResponse.json({ error: "not_connected" }, { status: 409 });

  try {
    const report = await getInstagramReport({
      igUserId: account.external_user_id,
      token: account.access_token,
      since: range.since,
      until: range.until,
    });
    return NextResponse.json({ ...report, range: { since: range.sinceDate, until: range.untilDate, days: range.days } });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}
