"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ContattosLogo from "@/components/ContattosLogo";

export default function PendingPage() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F6F3] px-4">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-[#DDE0E6] bg-white text-center shadow-sm">
        <div className="h-1.5 bg-gradient-to-r from-brand-amber via-brand-orange to-brand-red" />
        <div className="p-8">
          <ContattosLogo size="md" className="mb-4 justify-center" />
          <h1 className="mb-2 text-lg font-bold text-[#0A0E1A]">Cadastro em análise</h1>
          <p className="text-sm text-[#4A4E5C]">
            Sua conta ainda está aguardando aprovação do administrador. Você recebe acesso ao
            Marketing OS automaticamente assim que ela for aprovada.
          </p>
          <button
            onClick={handleLogout}
            className="mt-6 rounded-md border border-[#DDE0E6] px-4 py-2 text-sm font-semibold text-[#0A0E1A]"
          >
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}
