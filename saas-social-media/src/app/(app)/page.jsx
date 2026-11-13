"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, Plus } from "lucide-react";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { MediaView } from "@/components/PostPreview";
import PostMini from "@/components/PostMini";
import ClientCard from "@/components/ClientCard";
import Loading from "@/components/Loading";
import { STATUSES, sameDay } from "@/lib/posts";

const COUNTERS = [
  { key: "draft", label: "Rascunho", color: "#CBD5E1" },
  { key: "in_review", label: "Em aprovação", color: "#F5A524" },
  { key: "changes_requested", label: "Ajuste", color: "#FF7A99" },
  { key: "scheduled", label: "Aprovado / agendado", color: "#4ADE9B", also: ["approved"] },
];

export default function DashboardPage() {
  const { loading, posts, clients, clientById, accounts, openEditor, href, user } = useWorkspace();
  if (loading) return <Loading />;

  const count = (c) => posts.filter((p) => p.status === c.key || c.also?.includes(p.status)).length;
  const now = Date.now();
  const upcoming = posts
    .filter((p) => p.scheduled_at && new Date(p.scheduled_at).getTime() >= now && !["published", "draft"].includes(p.status))
    .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
    .slice(0, 6);
  const waiting = posts.filter((p) => ["in_review", "changes_requested", "failed"].includes(p.status));
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + i);
    return d;
  });
  const raw = user.email.split("@")[0].split(/[._-]/)[0];
  const name = raw.charAt(0).toUpperCase() + raw.slice(1);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Olá, {name} 👋</h1>
          <p className="mt-1 text-sm text-ink-soft">Aqui está o resumo da sua operação de conteúdo.</p>
        </div>
        <div className="flex gap-2">
          <Link href={href("/calendario")} className="btn-ghost"><CalendarDays size={16} /> Calendário</Link>
          <button onClick={() => openEditor()} className="btn-primary"><Plus size={16} strokeWidth={2.5} /> Novo post</button>
        </div>
      </div>

      {/* Barra de status */}
      <div className="relative overflow-hidden rounded-3xl bg-navy p-5 text-white shadow-float sm:p-6">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-brand/40 blur-3xl" />
        <div className="relative grid grid-cols-2 gap-4 sm:grid-cols-4">
          {COUNTERS.map((c) => (
            <Link key={c.key} href={href("/quadro")} className="rounded-2xl bg-white/[.06] p-4 ring-1 ring-white/10 transition hover:bg-white/10">
              <div className="text-3xl font-extrabold sm:text-4xl" style={{ color: c.color }}>
                {count(c)}
              </div>
              <div className="mt-1 text-xs font-medium text-white/65">{c.label}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Semana */}
      <section className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold">Próximos 7 dias</h2>
          <Link href={href("/calendario")} className="flex items-center gap-1 text-sm font-semibold text-brand">Ver calendário <ArrowRight size={14} /></Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {week.map((day, i) => {
            const dayPosts = posts.filter((p) => p.scheduled_at && sameDay(new Date(p.scheduled_at), day));
            return (
              <div key={day.toISOString()} className={`rounded-2xl border p-2.5 ${i === 0 ? "border-brand-ring bg-brand-soft/50" : "border-line bg-paper/60"}`}>
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="text-[11px] font-semibold uppercase text-ink-mute">{day.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}</span>
                  <span className={`text-sm font-bold ${i === 0 ? "text-brand" : ""}`}>{day.getDate()}</span>
                </div>
                <div className="space-y-1.5">
                  {dayPosts.length === 0 && <div className="py-3 text-center text-[11px] text-ink-mute">—</div>}
                  {dayPosts.slice(0, 3).map((p) => (
                    <button key={p.id} onClick={() => openEditor(p)} className="flex w-full items-center gap-1.5 rounded-lg bg-white p-1 text-left shadow-sm ring-1 ring-line hover:ring-brand-ring">
                      <div className="h-7 w-7 shrink-0 overflow-hidden rounded-md" style={{ background: clientById[p.client_id]?.color }}>
                        {p.media?.[0] && <MediaView item={p.media[0]} className="h-full w-full object-cover" />}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-[11px] font-semibold leading-tight">{p.title || "Post"}</div>
                        <div className="flex items-center gap-1 text-[10px] text-ink-mute">
                          <span className={`h-1.5 w-1.5 rounded-full ${STATUSES[p.status].dot}`} />
                          {new Date(p.scheduled_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </button>
                  ))}
                  {dayPosts.length > 3 && <div className="text-center text-[10px] font-semibold text-ink-mute">+{dayPosts.length - 3}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-2 font-bold">Próximas publicações</h2>
          {upcoming.length === 0 ? <Empty text="Nada agendado ainda." /> : upcoming.map((p) => (
            <PostMini key={p.id} post={p} client={clientById[p.client_id]} onClick={() => openEditor(p)} />
          ))}
        </section>
        <section className="card p-5">
          <h2 className="mb-2 font-bold">Aguardando o cliente</h2>
          {waiting.length === 0 ? <Empty text="Tudo em dia ✨" /> : waiting.slice(0, 6).map((p) => (
            <PostMini key={p.id} post={p} client={clientById[p.client_id]} onClick={() => openEditor(p)} />
          ))}
        </section>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Seus clientes</h2>
            <p className="text-sm text-ink-soft">Cada cliente tem seu próprio espaço.</p>
          </div>
          <Link href={href("/clientes")} className="flex items-center gap-1 text-sm font-semibold text-brand">Ver todos <ArrowRight size={14} /></Link>
        </div>
        {clients.length === 0 ? (
          <div className="card p-8 text-center">
            <h3 className="font-bold">Comece cadastrando seu primeiro cliente 🚀</h3>
            <p className="mt-1 text-sm text-ink-soft">Depois crie os posts e envie o link de aprovação.</p>
            <Link href={href("/clientes")} className="btn-primary mt-5">Cadastrar cliente</Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {clients.slice(0, 4).map((c) => (
              <ClientCard key={c.id} client={c} posts={posts.filter((p) => p.client_id === c.id)} account={accounts.find((a) => a.client_id === c.id)} href={href(`/clientes/${c.id}`)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Empty({ text }) {
  return <div className="py-8 text-center text-sm text-ink-mute">{text}</div>;
}
