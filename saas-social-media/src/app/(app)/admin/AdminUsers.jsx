"use client";

import { useState } from "react";
import { Check, RotateCcw, ShieldCheck, X } from "lucide-react";

const TABS = [
  ["pending", "Aguardando"],
  ["approved", "Aprovados"],
  ["rejected", "Recusados"],
];

const STATUS_CHIP = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-600",
};
const STATUS_LABEL = { pending: "Aguardando", approved: "Aprovado", rejected: "Recusado" };

export default function AdminUsers({ initial }) {
  const [profiles, setProfiles] = useState(initial);
  const [tab, setTab] = useState("pending");
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");

  async function act(id, action) {
    setBusy(id);
    setError("");
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: id, action }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) return setError(json.error || "Não foi possível salvar.");
    setProfiles((list) => list.map((p) => (p.id === id ? json.profile : p)));
  }

  const visible = profiles.filter((p) => p.status === tab);
  const count = (s) => profiles.filter((p) => p.status === s).length;

  return (
    <div>
      <h1 className="page-title">Aprovação de cadastros</h1>
      <p className="mt-1 text-sm text-ink-soft">Quem cria conta só acessa o sistema depois que você aprovar.</p>

      <div className="mt-6 inline-flex rounded-xl border border-line bg-white p-1 text-sm">
        {TABS.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 font-semibold transition ${tab === k ? "bg-navy text-white" : "text-ink-soft hover:text-ink"}`}>
            {l}
            <span className={`rounded-full px-1.5 text-[11px] ${tab === k ? "bg-white/20" : "bg-paper"}`}>{count(k)}</span>
          </button>
        ))}
      </div>

      {error && <div className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}

      <div className="card mt-4 divide-y divide-line">
        {visible.length === 0 && (
          <div className="p-10 text-center text-sm text-ink-mute">
            {tab === "pending" ? "Nenhum cadastro aguardando aprovação ✨" : "Ninguém por aqui."}
          </div>
        )}
        {visible.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-sm font-bold text-brand">
              {(p.full_name || p.email).slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate font-semibold">{p.full_name || "Sem nome"}</span>
                {p.is_admin && <span className="chip bg-navy text-white"><ShieldCheck size={12} /> Admin</span>}
                <span className={`chip ${STATUS_CHIP[p.status]}`}>{STATUS_LABEL[p.status]}</span>
              </div>
              <div className="truncate text-sm text-ink-soft">{p.email}</div>
              <div className="text-xs text-ink-mute">Cadastro em {new Date(p.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</div>
            </div>
            {!p.is_admin && (
              <div className="flex gap-2">
                {p.status !== "approved" && (
                  <button onClick={() => act(p.id, "approve")} disabled={busy === p.id} className="btn bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-700">
                    <Check size={16} /> Aprovar
                  </button>
                )}
                {p.status !== "rejected" && (
                  <button onClick={() => act(p.id, "reject")} disabled={busy === p.id} className="btn-ghost px-3 py-2 text-rose-600">
                    <X size={16} /> {p.status === "approved" ? "Bloquear" : "Recusar"}
                  </button>
                )}
                {p.status === "rejected" && (
                  <button onClick={() => act(p.id, "reset")} disabled={busy === p.id} className="btn-ghost px-3 py-2">
                    <RotateCcw size={16} /> Voltar para análise
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
