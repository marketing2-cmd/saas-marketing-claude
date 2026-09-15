"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const STATUS_LABEL = { pending: "Pendente", approved: "Aprovado", rejected: "Rejeitado" };
const STATUS_COLOR = { pending: "#C9960A", approved: "#00A99D", rejected: "#E23744" };

export default function ApprovalPanel({ initialProfiles }) {
  const router = useRouter();
  const [profiles, setProfiles] = useState(initialProfiles);
  const [busyId, setBusyId] = useState(null);

  async function act(id, action) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id }),
      });
      if (res.ok) {
        const { profile } = await res.json();
        setProfiles((prev) => prev.map((p) => (p.id === id ? profile : p)));
      }
    } finally {
      setBusyId(null);
    }
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const pending = profiles.filter((p) => p.status === "pending");
  const others = profiles.filter((p) => p.status !== "pending");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <Link href="/" className="text-sm font-semibold text-brand-red">
            ← Voltar ao app
          </Link>
          <Link href="/admin/sorteio" className="text-sm font-semibold text-[#8A8DA0]">
            Participantes do sorteio
          </Link>
        </div>
        <button onClick={handleLogout} className="text-sm font-semibold text-[#8A8DA0]">
          Sair
        </button>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-[#8A8DA0]">
          Pendentes ({pending.length})
        </h2>
        {pending.length === 0 && (
          <div className="rounded-md border border-[#EAECEF] bg-white p-4 text-sm text-[#8A8DA0]">
            Nenhum cadastro pendente.
          </div>
        )}
        <div className="flex flex-col gap-2">
          {pending.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-md border border-[#DDE0E6] bg-white p-4">
              <div>
                <div className="font-semibold text-[#0A0E1A]">{p.email}</div>
                <div className="text-xs text-[#8A8DA0]">
                  solicitado em {new Date(p.created_at).toLocaleDateString("pt-BR")}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  disabled={busyId === p.id}
                  onClick={() => act(p.id, "approve")}
                  className="rounded-md bg-gradient-to-r from-brand-amber via-brand-orange to-brand-red px-3 py-1.5 text-sm font-bold text-white shadow-sm disabled:opacity-60"
                >
                  Aprovar
                </button>
                <button
                  disabled={busyId === p.id}
                  onClick={() => act(p.id, "reject")}
                  className="rounded-md border border-[#FBDEE1] px-3 py-1.5 text-sm font-semibold text-[#E23744] disabled:opacity-60"
                >
                  Rejeitar
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-[#8A8DA0]">
          Outras contas ({others.length})
        </h2>
        <div className="flex flex-col gap-2">
          {others.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-md border border-[#EAECEF] bg-white p-4">
              <div className="font-semibold text-[#0A0E1A]">
                {p.email}
                {p.role === "admin" && <span className="ml-1 text-xs font-normal text-brand-red">(admin)</span>}
              </div>
              <span className="text-sm font-semibold" style={{ color: STATUS_COLOR[p.status] }}>
                {STATUS_LABEL[p.status]}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
