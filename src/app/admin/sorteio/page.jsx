import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/authGuard";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import SorteioTable from "./SorteioTable";

export const dynamic = "force-dynamic";

export default async function SorteioAdminPage() {
  const auth = await requireAdmin();
  if (auth.error) redirect("/login");

  const supabase = getSupabaseServerClient();
  const { data: entries } = await supabase
    .from("raffle_entries")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-[#F5F6F3] p-6 md:p-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-1 text-xl font-bold text-[#0A0E1A]">Participantes do sorteio</h1>
        <p className="mb-6 text-sm text-[#8A8DA0]">Marketing OS — Contattos+</p>
        <SorteioTable initialEntries={entries || []} />
      </div>
    </div>
  );
}
