import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/authGuard";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { userId } = await request.json();
  if (!userId) return NextResponse.json({ error: "userId é obrigatório." }, { status: 400 });

  try {
    // Sessão do próprio admin: a policy "profiles_update_admin" (supabase/verbas.sql)
    // libera o update só para role = admin, sem precisar da service role key.
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .update({ status: "rejected", approved_at: null, approved_by: auth.user.sub })
      .eq("id", userId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ profile: data });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
