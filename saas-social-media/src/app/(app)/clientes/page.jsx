"use client";

import Link from "next/link";
import { useState } from "react";
import { Instagram, Plus, X } from "lucide-react";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { Avatar, MediaView } from "@/components/PostPreview";
import ClientForm from "@/components/ClientForm";
import CopyLink from "@/components/CopyLink";
import Loading from "@/components/Loading";

export default function ClientsPage() {
  const { loading, clients, posts, accounts } = useWorkspace();
  const [creating, setCreating] = useState(false);

  if (loading) return <Loading />;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="mt-1 text-sm text-ink-soft">Cada cliente tem seu próprio espaço, feed e link de aprovação.</p>
        </div>
        <button onClick={() => setCreating(true)} className="btn-primary"><Plus size={16} /> Novo cliente</button>
      </div>

      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={(e) => e.target === e.currentTarget && setCreating(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold">Novo cliente</h2>
              <button onClick={() => setCreating(false)} className="rounded-lg p-1 hover:bg-paper" aria-label="Fechar"><X size={18} /></button>
            </div>
            <ClientForm onDone={() => setCreating(false)} />
          </div>
        </div>
      )}

      {clients.length === 0 ? (
        <div className="card mt-6 p-10 text-center text-sm text-ink-mute">Nenhum cliente ainda. Clique em <b>Novo cliente</b> para começar.</div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((c) => {
            const clientPosts = posts.filter((p) => p.client_id === c.id);
            const pending = clientPosts.filter((p) => p.status === "in_review").length;
            const thumbs = clientPosts.filter((p) => p.media?.[0]).slice(0, 3);
            const account = accounts.find((a) => a.client_id === c.id);
            return (
              <Link key={c.id} href={`/clientes/${c.id}`} className="card overflow-hidden transition hover:border-brand">
                <div className="h-16" style={{ background: `linear-gradient(135deg, ${c.color}, ${c.color}55)` }} />
                <div className="-mt-6 px-4 pb-4">
                  <div className="rounded-full bg-white p-1 inline-block"><Avatar client={c} size={44} /></div>
                  <div className="mt-1 font-bold">{c.name}</div>
                  <div className="flex items-center gap-1 text-xs text-ink-mute">
                    <Instagram size={12} /> {account ? <span className="text-emerald-600">@{account.username} conectado</span> : c.instagram_handle || "Instagram não conectado"}
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-1">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="aspect-square overflow-hidden rounded bg-paper">
                        {thumbs[i] && <MediaView item={thumbs[i].media[0]} className="h-full w-full object-cover" />}
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-ink-soft">{clientPosts.length} posts · {pending} em aprovação</span>
                    <CopyLink path={`/c/${c.approval_token}`} label="Link" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
