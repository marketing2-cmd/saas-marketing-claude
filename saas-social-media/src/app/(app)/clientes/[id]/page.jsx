"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ExternalLink, Instagram, Pencil, Plus, Trash2 } from "lucide-react";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { Avatar } from "@/components/PostPreview";
import FeedGrid from "@/components/FeedGrid";
import ClientForm from "@/components/ClientForm";
import CopyLink from "@/components/CopyLink";
import Dialog from "@/components/Dialog";
import PostMini from "@/components/PostMini";
import Loading from "@/components/Loading";
import { clientGradient } from "@/lib/posts";

export default function ClientPage() {
  const { id } = useParams();
  const params = useSearchParams();
  const router = useRouter();
  const { loading, clientById, posts, accounts, openEditor, deleteClient, reload, notify, href, demo } = useWorkspace();
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState("feed");

  if (loading) return <Loading />;
  const client = clientById[id];
  if (!client) return <div className="py-20 text-center text-sm text-ink-mute">Cliente não encontrado.</div>;

  const clientPosts = posts.filter((p) => p.client_id === id);
  const account = accounts.find((a) => a.client_id === id);
  const metaError = params.get("meta_error");
  const connected = params.get("connected");
  const portalPath = demo ? "/demo/portal" : `/c/${client.approval_token}`;
  const stats = [
    ["Posts", clientPosts.length],
    ["Em aprovação", clientPosts.filter((p) => p.status === "in_review").length],
    ["Agendados", clientPosts.filter((p) => p.status === "scheduled").length],
    ["Publicados", clientPosts.filter((p) => p.status === "published").length],
  ];

  async function remove() {
    if (!confirm(`Excluir ${client.name} e todos os posts dele? Isso não pode ser desfeito.`)) return;
    await deleteClient(id);
    router.push(href("/clientes"));
  }

  async function disconnect() {
    if (demo) return notify("Na demonstração as contas não são alteradas.");
    if (!confirm("Desconectar o Instagram deste cliente? Posts agendados não serão publicados.")) return;
    const res = await fetch("/api/meta/disconnect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ client_id: id }) });
    if (!res.ok) return notify("Não foi possível desconectar.", "error");
    await reload();
    notify("Instagram desconectado.");
  }

  return (
    <div>
      <Link href={href("/clientes")} className="inline-flex items-center gap-1 text-sm font-medium text-ink-soft hover:text-ink"><ArrowLeft size={14} /> Todos os clientes</Link>

      <div className="card mt-4 overflow-hidden">
        <div className="relative h-28" style={{ background: clientGradient(client.color) }}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(255,255,255,.75),transparent_45%)]" />
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4 px-5 pb-5">
          <div className="-mt-10 flex items-end gap-4">
            <div className="rounded-full bg-white p-1.5 shadow-soft"><Avatar client={client} size={76} /></div>
            <div className="pb-1">
              <h1 className="text-2xl font-bold tracking-tight">{client.name}</h1>
              <div className="text-sm text-ink-soft">{client.instagram_handle}</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setEditing(true)} className="btn-ghost"><Pencil size={16} /> Editar</button>
            <button onClick={() => openEditor({ client_id: id })} className="btn-primary"><Plus size={16} strokeWidth={2.5} /> Novo post</button>
          </div>
        </div>
        <div className="grid grid-cols-2 border-t border-line sm:grid-cols-4">
          {stats.map(([l, n]) => (
            <div key={l} className="border-line px-5 py-3 [&:not(:last-child)]:border-r">
              <div className="text-xl font-bold">{n}</div>
              <div className="text-xs text-ink-mute">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {connected && <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">Instagram conectado! Posts aprovados com data serão publicados automaticamente.</div>}
      {metaError && <div className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">Não foi possível conectar o Instagram: {metaError}</div>}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_330px]">
        <section>
          <div className="mb-4 inline-flex rounded-xl border border-line bg-white p-1 text-sm">
            {[["feed", "Prévia do feed"], ["list", "Todos os posts"]].map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)} className={`rounded-lg px-4 py-1.5 font-semibold transition ${tab === k ? "bg-navy text-white" : "text-ink-soft hover:text-ink"}`}>{l}</button>
            ))}
          </div>
          {tab === "feed" ? (
            <>
              <p className="mb-3 text-sm text-ink-soft">Veja como o perfil vai ficar com os posts planejados.</p>
              <div className="mx-auto max-w-[560px]"><FeedGrid posts={clientPosts} onOpen={openEditor} /></div>
            </>
          ) : (
            <div className="card p-2">
              {clientPosts.length === 0 && <div className="p-6 text-center text-sm text-ink-mute">Nenhum post ainda.</div>}
              {clientPosts.map((p) => <PostMini key={p.id} post={p} client={client} onClick={() => openEditor(p)} />)}
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <div className="card p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600"><CheckCircle2 size={20} /></div>
            <h3 className="mt-3 font-bold">Link de aprovação</h3>
            <p className="mt-1 text-sm text-ink-soft">O cliente abre, vê os posts, aprova ou pede ajuste — sem login e sem WhatsApp.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <CopyLink path={portalPath} />
              <a href={portalPath} target="_blank" rel="noreferrer" className="btn-ghost px-3 py-1.5 text-xs"><ExternalLink size={14} /> Abrir</a>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#FEDA75] via-[#D62976] to-[#4F5BD5] text-white"><Instagram size={20} /></div>
            <h3 className="mt-3 font-bold">Publicação automática</h3>
            {account ? (
              <>
                <p className="mt-1 text-sm text-ink-soft">Conectado como <b className="text-emerald-600">@{account.username}</b>. Posts aprovados com data são publicados sozinhos.</p>
                <button onClick={disconnect} className="btn-ghost mt-4 px-3 py-1.5 text-xs">Desconectar</button>
              </>
            ) : (
              <>
                <p className="mt-1 text-sm text-ink-soft">Conecte a conta profissional do Instagram (vinculada a uma Página do Facebook).</p>
                {demo ? (
                  <button onClick={() => notify("Na demonstração não é possível conectar contas.")} className="btn-dark mt-4 px-3 py-1.5 text-xs">Conectar Instagram</button>
                ) : (
                  <a href={`/api/meta/connect?client_id=${id}`} className="btn-dark mt-4 px-3 py-1.5 text-xs">Conectar Instagram</a>
                )}
              </>
            )}
          </div>

          {client.notes && (
            <div className="card p-5">
              <h3 className="font-bold">Observações</h3>
              <p className="mt-1 whitespace-pre-wrap text-sm text-ink-soft">{client.notes}</p>
            </div>
          )}

          <button onClick={remove} className="btn w-full text-rose-600 hover:bg-rose-50"><Trash2 size={16} /> Excluir cliente</button>
        </aside>
      </div>

      {editing && (
        <Dialog title="Editar cliente" onClose={() => setEditing(false)}>
          <ClientForm initial={client} onDone={() => setEditing(false)} />
        </Dialog>
      )}
    </div>
  );
}
