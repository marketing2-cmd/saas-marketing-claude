import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/supabase/server";
import OnboardingForm from "./OnboardingForm";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const { user, workspace } = await getSessionContext();
  if (!user) redirect("/login");
  if (!user.approved) redirect("/aguardando");
  if (workspace) redirect("/");
  return <OnboardingForm />;
}
