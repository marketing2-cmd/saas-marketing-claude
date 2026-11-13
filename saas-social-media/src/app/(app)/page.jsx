"use client";

import Link from "next/link";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { Avatar, MediaView } from "@/components/PostPreview";
import StatusBadge from "@/components/StatusBadge";
import Loading from "@/components/Loading";
import { STATUSES, formatDateTime } from "@/lib/posts";

export default function DashboardPage() {
  const { loading, posts, clients, clientById, openEditor } = useWorkspace();
  if (loading) return <Loading />;

  const count = (s) => posts.filter((p) => p.status === s).length;
  const now = Date.now();
  const upcoming = posts
    .filter((p) => p.scheduled_at && new Date(p.scheduled_at).getTime() >= now && p.status !== "published")
    .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
    .slice(0, 8);
  const attention = posts.filter((p) => p.status === "changes_requested" || p.status === "failed");

  return (
    <div>
      <h1 className="text-2xl font-bold">Visão geral</h1>
      <p className="mt-1 text-sm text-ink-soft">{clients.length} cliente(s) · {posts.length} post(s)</p>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {["draft", "in_review", "changes_requested", "scheduled"].map((s) => (
          <Link key={s} href="/quadro" className="card p-4 transition hover:border-brand">
            <div className="text-3xl font-bold">{count(s)}</div>
            <div className="mt-1 text-sm text-ink-soft">{STATUSES[s].label}</div>
          </Link>
        ))}
      </div>

      {clients.length === 0 && (
        <div className="card mt-6 p-6">
          <h2 className="font-bold">Comece por aqui 🚀</h2>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-ink-soft">
            <li>Cadastre seus clientes em <Link href="/clientes" className="font-semibold text-brand">Clientes</Link>.</li>
            <li>Crie posts com legenda, mídia e data.</li>
            <li>Envie o link de aprovação para o cliente — ao aprovar, o post é agendado automaticamente.</li>
          </ol>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 font-bold">Próximas publicações</h2>
          <PostList posts={upcoming} clientById={clientById} openEditor={openEditor} empty="Nada agendado para os próximos dias." />
        </section>
        <section>
          <h2 className="mb-3 font-bold">Precisa de atenção</h2>
          <PostList posts={attention} clientById={clientById} openEditor={openEditor} empty="Tudo em dia ✨" />
        </section>
      </div>
    </div>
  );
}

function PostList({ posts, clientById, openEditor, empty }) {
  if (!posts.length) return <div className="card p-6 text-sm text-ink-mute">{empty}</div>;
  return (
    <div className="card divide-y divide-line">
      {posts.map((p) => (
        <button key={p.id} onClick={() => openEditor(p)} className="flex w-full items-center gap-3 p-3 text-left hover:bg-paper">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-paper">
            {p.media?.[0] ? <MediaView item={p.media[0]} className="h-full w-full object-cover" /> : <Avatar client={clientById[p.client_id]} size={48} />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{p.title || p.caption?.slice(0, 60) || "Sem título"}</div>
            <div className="text-xs text-ink-mute">{clientById[p.client_id]?.name} · {formatDateTime(p.scheduled_at)}</div>
          </div>
          <StatusBadge status={p.status} />
        </button>
      ))}
    </div>
  );
}
