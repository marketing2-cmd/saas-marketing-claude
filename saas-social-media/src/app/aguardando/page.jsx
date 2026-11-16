import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AuthCard from "@/components/AuthCard";
import LogoutButton from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function PendingPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");

  const { data: profile } = await supabase
    .from("platform_profiles")
    .select("status, email")
    .eq("id", data.claims.sub)
    .maybeSingle();

  const rejected = profile?.status === "rejected";

  return (
    <AuthCard
      title={rejected ? "Cadastro não aprovado" : "Cadastro em análise ⏳"}
      subtitle={
        rejected
          ? "Seu pedido de acesso não foi aprovado. Se acha que é um engano, fale com a gente."
          : `Recebemos seu cadastro (${profile?.email || data.claims.email}). Assim que for aprovado, é só entrar de novo para começar a usar.`
      }
    >
      <LogoutButton />
    </AuthCard>
  );
}
