"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Instagram, Pencil, Plus, Trash2, X } from "lucide-react";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { Avatar } from "@/components/PostPreview";
import FeedGrid from "@/components/FeedGrid";
import ClientForm from "@/components/ClientForm";
import CopyLink from "@/components/CopyLink";
import Loading from "@/components/Loading";

export default function ClientPage() {
  const { id } = useParams();
  const params = useSearchParams();
  const router = useRouter();
  const { loading, clientById, posts, accounts, openEditor, deleteClient, reload, notify } = useWorkspace();
  const [editing, setEditing] = useState(false);

  if (loading) return <Loading />;
  const client = clientById[id];
  if (!client) return <div className="py-20 text-center text-sm text-ink-mute">Cliente não encontrado.</div>;

  const clientPosts = posts.filter((p) => p.client_id === id);
  const account = accounts.find((a) => a.client_id === id);
  const metaError = params.get("meta_error");
  const connected = params.get("connected");

  async function remove() {
    if (!confirm(`Excluir ${client.name} e todos os posts dele? Isso não pode ser desfeito.`)) return;
    await deleteClient(id);
    router.push("/clientes");
  }

  async function disconnect() {
    if (!confirm("Desconectar o Instagram deste cliente? Posts agendados não serão publicados.")) return;
    const res = await fetch("/api/meta/disconnect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ client_id: id }) });
    if (!res.ok) return notify("Não foi possível desconectar.", "error");
    await reload();
    notify("Instagram desconectado.");
  }

  return (
    <div>
      <Link href="/clientes" className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink"><ArrowLeft size={14} /> Clientes</Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar client={client} size={64} />
          <div>
            <h1 className="text-2xl font-bold">{client.name}</h1>
            <div className="text-sm text-ink-soft">{client.instagram_handle}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setEditing(true)} className="btn-ghost"><Pencil size={16} /> Editar</button>
          <button onClick={() => openEditor({ client_id: id })} className="btn-primary"><Plus size={16} /> Novo post</button>
        </div>
      </div>

      {connected && <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">Instagram conectado com sucesso! Posts aprovados com data serão publicados automaticamente.</div>}
      {metaError && <div className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">Não foi possível conectar o Instagram: {metaError}</div>}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <section>
          <h2 className="mb-1 font-bold">Prévia do feed</h2>
          <p className="mb-3 text-sm text-ink-soft">Como o perfil vai ficar com os posts planejados (mais recentes primeiro).</p>
          <FeedGrid posts={clientPosts} onOpen={openEditor} />
        </section>

        <aside className="space-y-4">
          <div className="card p-4">
            <h3 className="font-semibold">Portal de aprovação</h3>
            <p className="mt-1 text-sm text-ink-soft">Envie este link para o cliente. Ele vê os posts em aprovação, aprova ou pede ajustes — sem precisar de login.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <CopyLink path={`/c/${client.approval_token}`} />
              <a href={`/c/${client.approval_token}`} target="_blank" rel="noreferrer" className="btn-ghost px-3 py-1.5 text-xs"><ExternalLink size={14} /> Abrir</a>
            </div>
          </div>

          <div className="card p-4">
            <h3 className="flex items-center gap-2 font-semibold"><Instagram size={16} /> Publicação automática</h3>
            {account ? (
              <>
                <p className="mt-1 text-sm text-emerald-700">Conectado como <b>@{account.username}</b></p>
                <button onClick={disconnect} className="btn-ghost mt-3 px-3 py-1.5 text-xs">Desconectar</button>
              </>
            ) : (
              <>
                <p className="mt-1 text-sm text-ink-soft">Conecte a conta profissional do Instagram (vinculada a uma Página do Facebook) para publicar automaticamente.</p>
                <a href={`/api/meta/connect?client_id=${id}`} className="btn-primary mt-3 px-3 py-1.5 text-xs">Conectar Instagram</a>
              </>
            )}
          </div>

          {client.notes && (
            <div className="card p-4">
              <h3 className="font-semibold">Observações</h3>
              <p className="mt-1 whitespace-pre-wrap text-sm text-ink-soft">{client.notes}</p>
            </div>
          )}

          <button onClick={remove} className="btn w-full text-rose-600 hover:bg-rose-50"><Trash2 size={16} /> Excluir cliente</button>
        </aside>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={(e) => e.target === e.currentTarget && setEditing(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold">Editar cliente</h2>
              <button onClick={() => setEditing(false)} className="rounded-lg p-1 hover:bg-paper" aria-label="Fechar"><X size={18} /></button>
            </div>
            <ClientForm initial={client} onDone={() => setEditing(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
