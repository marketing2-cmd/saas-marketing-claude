import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";

export default async function AppLayout({ children }) {
  const { user, workspace } = await getSessionContext();
  if (!user) redirect("/login");
  if (!workspace) redirect("/onboarding");

  return (
    <AppShell user={user} workspace={workspace}>
      {children}
    </AppShell>
  );
}
