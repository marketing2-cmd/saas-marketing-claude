"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
      <div className="w-full max-w-md rounded-xl border border-[#DDE0E6] bg-white p-8 text-center shadow-sm">
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
  );
}
