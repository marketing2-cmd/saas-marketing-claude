"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
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

  if (loading) return <Loading />;
  const visible = clients.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));

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
            <input className="input w-56 pl-9" placeholder="Buscar cliente…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <button onClick={() => setCreating(true)} className="btn-primary"><Plus size={16} strokeWidth={2.5} /> Novo cliente</button>
        </div>
      </div>

      {creating && (
        <Dialog title="Novo cliente" onClose={() => setCreating(false)}>
          <ClientForm onDone={() => setCreating(false)} />
        </Dialog>
      )}

      {clients.length === 0 ? (
        <div className="card mt-6 p-10 text-center text-sm text-ink-mute">Nenhum cliente ainda. Clique em <b>Novo cliente</b> para começar.</div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
