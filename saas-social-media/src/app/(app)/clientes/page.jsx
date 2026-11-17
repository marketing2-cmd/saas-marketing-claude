"use client";

import { useState } from "react";
import { AlertTriangle, Plus, Search, TrendingUp, Users, Wallet } from "lucide-react";
import { CONTRACT_STATUSES, daysUntil, formatBRL } from "@/lib/clients";
import Dialog from "@/components/Dialog";
import { useWorkspace } from "@/components/WorkspaceProvider";
import ClientForm from "@/components/ClientForm";
import ClientCard from "@/components/ClientCard";
import CopyLink from "@/components/CopyLink";
import Loading from "@/components/Loading";

export default function ClientsPage() {
  const { loading, clients, posts, accounts, href, demo } = useWorkspace();
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [niche, setNiche] = useState("");

  if (loading) return <Loading />;
  const visible = clients.filter(
    (c) =>
      [c.name, c.instagram_handle, c.niche, c.contact_email, c.contact_name].filter(Boolean).join(" ").toLowerCase().includes(query.trim().toLowerCase()) &&
      (!statusFilter || (c.contract_status || "active") === statusFilter) &&
      (!niche || c.niche === niche)
  );
  const active = clients.filter((c) => (c.contract_status || "active") === "active");
  const mrr = active.reduce((a, c) => a + (Number(c.monthly_fee) || 0), 0);
  const withFee = active.filter((c) => Number(c.monthly_fee) > 0);
  const expiring = clients.filter((c) => {
    const d = daysUntil(c.contract_end);
    return (c.contract_status || "active") === "active" && d !== null && d <= 30;
  });
  const niches = [...new Set(clients.map((c) => c.niche).filter(Boolean))].sort();

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Todos os clientes</h1>
          <p className="mt-1 text-sm text-ink-soft">Cada cliente tem seu próprio espaço, feed e link de aprovação.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" />
            <input className="input w-72 max-w-full pl-9" placeholder="Buscar por nome, @, nicho ou e-mail…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <button onClick={() => setCreating(true)} className="btn-primary"><Plus size={16} strokeWidth={2.5} /> Novo cliente</button>
        </div>
      </div>

      {clients.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            [Wallet, "Receita mensal", formatBRL(mrr), "contratos ativos"],
            [Users, "Clientes ativos", active.length, `de ${clients.length} cadastrados`],
            [TrendingUp, "Ticket médio", withFee.length ? formatBRL(mrr / withFee.length) : "—", "por cliente ativo"],
            [AlertTriangle, "Contratos vencendo", expiring.length, "nos próximos 30 dias", expiring.length > 0],
          ].map(([Icon, label, value, sub, warn]) => (
            <div key={label} className={`card p-4 ${warn ? "ring-1 ring-amber-200" : ""}`}>
              <div className="flex items-center gap-2 text-xs font-semibold text-ink-soft"><Icon size={15} className={warn ? "text-amber-500" : "text-brand"} /> {label}</div>
              <div className="mt-1.5 text-2xl font-bold tracking-tight">{value}</div>
              <div className="text-xs text-ink-mute">{sub}</div>
            </div>
          ))}
        </div>
      )}
      {expiring.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          <AlertTriangle size={16} /> Renovar:
          {expiring.map((c) => {
            const d = daysUntil(c.contract_end);
            return <a key={c.id} href={href(`/clientes/${c.id}`)} className="font-semibold underline-offset-2 hover:underline">{c.name} ({d < 0 ? `venceu há ${-d}d` : `${d}d`})</a>;
          })}
        </div>
      )}

      {clients.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          <select className="input w-auto py-2" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filtrar por status do contrato">
            <option value="">Todos os status</option>
            {Object.entries(CONTRACT_STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          {niches.length > 0 && (
            <select className="input w-auto py-2" value={niche} onChange={(e) => setNiche(e.target.value)} aria-label="Filtrar por nicho">
              <option value="">Todos os nichos</option>
              {niches.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          )}
        </div>
      )}

      {creating && (
        <Dialog title="Novo cliente" size="lg" onClose={() => setCreating(false)}>
          <ClientForm onDone={() => setCreating(false)} />
        </Dialog>
      )}

      {clients.length === 0 ? (
        <div className="card mt-6 p-10 text-center text-sm text-ink-mute">Nenhum cliente ainda. Clique em <b>Novo cliente</b> para começar.</div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((c) => (
            <ClientCard
              key={c.id}
              client={c}
              posts={posts.filter((p) => p.client_id === c.id)}
              account={accounts.find((a) => a.client_id === c.id)}
              href={href(`/clientes/${c.id}`)}
              footer={<CopyLink path={demo ? "/demo/portal" : `/c/${c.approval_token}`} label="Link" />}
            />
          ))}
          <button onClick={() => setCreating(true)} className="flex min-h-[260px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line text-sm font-semibold text-ink-mute transition hover:border-brand-ring hover:text-brand">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-brand"><Plus size={18} /></span>
            Adicionar cliente
          </button>
        </div>
      )}
    </div>
  );
}
