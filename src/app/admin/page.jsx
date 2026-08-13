import { createClient } from "@/lib/supabase/server";
import ApprovalPanel from "./ApprovalPanel";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, status, role, created_at, approved_at")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-[#F5F6F3] p-6 md:p-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-1 text-xl font-bold text-[#0A0E1A]">Aprovação de cadastros</h1>
        <p className="mb-6 text-sm text-[#8A8DA0]">Marketing OS — Contattos+</p>
        <ApprovalPanel initialProfiles={profiles || []} />
      </div>
    </div>
  );
}
