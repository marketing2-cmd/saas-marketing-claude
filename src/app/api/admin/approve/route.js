import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/authGuard";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { userId } = await request.json();
  if (!userId) return NextResponse.json({ error: "userId é obrigatório." }, { status: 400 });

  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("profiles")
      .update({ status: "approved", approved_at: new Date().toISOString(), approved_by: auth.user.sub })
      .eq("id", userId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ profile: data });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
