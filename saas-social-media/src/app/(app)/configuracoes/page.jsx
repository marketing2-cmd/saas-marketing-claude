"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Crown, Loader2, Mail, Trash2, UserPlus } from "lucide-react";
import { useWorkspace } from "@/components/WorkspaceProvider";
import MemberAvatar from "@/components/MemberAvatar";
import { STAGES } from "@/lib/posts";
import { FUNCTIONS, memberName } from "@/lib/team";

function FunctionChips({ value, onChange, disabled }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {Object.entries(FUNCTIONS).map(([k, l]) => {
        const on = value.includes(k);
        return (
          <button
            key={k}
            type="button"
            disabled={disabled}
            onClick={() => onChange(on ? value.filter((x) => x !== k) : [...value, k])}
            className={`chip px-2.5 py-1 text-[11px] transition ${on ? "bg-brand text-white" : "bg-paper text-ink-soft ring-1 ring-line"} ${disabled ? "cursor-default" : "hover:ring-brand-ring"}`}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { workspace, supabase, notify, user, demo, members, invites, inviteMember, cancelInvite, updateMemberFunctions, removeMember, deadlines, saveDeadlines } = useWorkspace();
  const [name, setName] = useState(workspace.name);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [functions, setFunctions] = useState([]);
  const [inviting, setInviting] = useState(false);
  const [dl, setDl] = useState(deadlines);
  const [copied, setCopied] = useState(null);
  const isOwner = workspace.role === "owner";

  async function save(e) {
    e.preventDefault();
    if (demo) return notify("Na demonstração nada é salvo.");
    setSaving(true);
    const { error } = await supabase.from("workspaces").update({ name }).eq("id", workspace.id);
    setSaving(false);
    if (error) return notify(error.message, "error");
    notify("Salvo.");
    router.refresh();
  }

  async function invite(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setInviting(true);
    const res = await inviteMember(email.trim(), functions);
    setInviting(false);
    if (res) {
      setEmail("");
      setFunctions([]);
    }
  }

  async function copyInvite(inv) {
    const url = `${window.location.origin}/signup?email=${encodeURIComponent(inv.email)}`;
    await navigator.clipboard.writeText(url);
    setCopied(inv.id);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="page-title">Configurações</h1>

      <form onSubmit={save} className="card space-y-4 p-6">
        <h2 className="font-bold">Espaço de trabalho</h2>
        <div>
          <label className="label" htmlFor="ws-name">Nome da agência</label>
          <input id="ws-name" className="input" value={name} onChange={(e) => setName(e.target.value)} disabled={!isOwner} />
        </div>
        <div className="text-sm text-ink-soft">Sua conta: {user.email} · {isOwner ? "Dona do espaço" : "Membro"}</div>
        {isOwner && <button className="btn-primary" disabled={saving}>{saving ? "Salvando…" : "Salvar"}</button>}
      </form>

      <section className="card p-6">
        <h2 className="font-bold">Equipe</h2>
        <p className="mt-1 text-sm text-ink-soft">Quem faz parte da agência e o que cada pessoa faz. As funções definem quem aparece primeiro como responsável de cada etapa.</p>

        <div className="mt-5 divide-y divide-line rounded-2xl border border-line">
          {members.map((m) => (
            <div key={m.user_id} className="flex flex-wrap items-center gap-3 p-4">
              <MemberAvatar member={m} size={38} />
              <div className="min-w-[180px] flex-1">
                <div className="flex items-center gap-1.5 font-semibold">
                  {memberName(m)}
                  {m.role === "owner" && <Crown size={14} className="text-amber-500" aria-label="Dona do espaço" />}
                  {m.user_id === user.id && <span className="text-xs font-normal text-ink-mute">(você)</span>}
                </div>
                <div className="text-xs text-ink-mute">{m.email}</div>
              </div>
              <div className="w-full sm:w-auto sm:max-w-[360px]">
                <FunctionChips value={m.functions || []} disabled={!isOwner} onChange={(f) => updateMemberFunctions(m.user_id, f)} />
              </div>
              {isOwner && m.role !== "owner" && (
                <button onClick={() => confirm(`Remover ${memberName(m)} da equipe?`) && removeMember(m.user_id)} className="btn px-2.5 py-2 text-rose-600 hover:bg-rose-50" aria-label="Remover da equipe">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>

        {isOwner && (
          <form onSubmit={invite} className="mt-5 space-y-3 rounded-2xl bg-paper/70 p-4 ring-1 ring-line">
            <div className="flex items-center gap-2 font-semibold"><UserPlus size={16} className="text-brand" /> Convidar pessoa</div>
            <div className="flex flex-wrap gap-2">
              <div className="relative min-w-[240px] flex-1">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" />
                <input type="email" required className="input bg-white pl-9" placeholder="email@da-pessoa.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <button className="btn-primary" disabled={inviting}>{inviting && <Loader2 size={14} className="animate-spin" />} Convidar</button>
            </div>
            <div>
              <div className="label">Funções</div>
              <FunctionChips value={functions} onChange={setFunctions} />
            </div>
            <p className="text-xs text-ink-mute">Se a pessoa já tem conta, entra na hora. Se não tem, fica um convite: copie o link e mande para ela se cadastrar com esse e-mail — ela entra aprovada e direto na sua agência.</p>
          </form>
        )}

        {invites.length > 0 && (
          <div className="mt-5">
            <div className="label">Convites aguardando cadastro</div>
            <div className="divide-y divide-line rounded-2xl border border-line">
              {invites.map((inv) => (
                <div key={inv.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
                  <Mail size={16} className="text-ink-mute" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{inv.email}</div>
                    <div className="text-xs text-ink-mute">{(inv.functions || []).map((f) => FUNCTIONS[f]).join(", ") || "Sem função definida"}</div>
                  </div>
                  <button onClick={() => copyInvite(inv)} className="btn-ghost px-3 py-1.5 text-xs">
                    {copied === inv.id ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />} {copied === inv.id ? "Copiado!" : "Copiar link"}
                  </button>
                  {isOwner && <button onClick={() => cancelInvite(inv.id)} className="btn px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50">Cancelar</button>}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="card p-6">
        <h2 className="font-bold">Prazos das etapas</h2>
        <p className="mt-1 text-sm text-ink-soft">Quantos dias antes da publicação cada etapa precisa estar pronta. Usado em “Minhas tarefas”.</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {STAGES.map((s) => (
            <div key={s.key}>
              <label className="label" htmlFor={`dl-${s.key}`}>{s.label}</label>
              <div className="relative">
                <input id={`dl-${s.key}`} type="number" min="0" max="60" className="input pr-16" value={dl[s.key]} disabled={!isOwner} onChange={(e) => setDl({ ...dl, [s.key]: Math.max(0, Math.min(60, Number(e.target.value) || 0)) })} />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-mute">dias antes</span>
              </div>
            </div>
          ))}
        </div>
        {isOwner && <button onClick={() => saveDeadlines(dl)} className="btn-primary mt-4">Salvar prazos</button>}
      </section>
    </div>
  );
}
