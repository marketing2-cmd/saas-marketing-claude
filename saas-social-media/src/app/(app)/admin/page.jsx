import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminUsers from "./AdminUsers";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const { data: me } = await supabase.from("platform_profiles").select("is_admin").eq("id", data?.claims?.sub || "").maybeSingle();
  if (!me?.is_admin) redirect("/");

  // RLS: admin enxerga todos os perfis
  const { data: profiles } = await supabase
    .from("platform_profiles")
    .select("id, email, full_name, status, is_admin, created_at, reviewed_at")
    .order("created_at", { ascending: false });

  return <AdminUsers initial={profiles || []} />;
}
