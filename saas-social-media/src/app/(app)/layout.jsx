import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";

// As checagens de aprovação e workspace ficam aqui (e não no middleware): o
// layout roda uma vez ao abrir o painel e não a cada clique. Os dados continuam
// protegidos pelo RLS, que exige conta aprovada.
export default async function AppLayout({ children }) {
  const { user, workspace } = await getSessionContext();
  if (!user) redirect("/login");
  if (!user.approved) redirect("/aguardando");
  if (!workspace) redirect("/onboarding");

  return (
    <AppShell user={user} workspace={workspace}>
      {children}
    </AppShell>
  );
}
