"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CalendarClock, CheckCircle2, Lock, MessageSquareWarning } from "lucide-react";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { Avatar, MediaView } from "@/components/PostPreview";
import MemberAvatar from "@/components/MemberAvatar";
import Loading from "@/components/Loading";
import { FORMATS, STAGE_STATUSES } from "@/lib/posts";
import { TASK_GROUPS, buildTasks, sortByDue } from "@/lib/tasks";
import { FUNCTIONS, memberName } from "@/lib/team";

function dueLabel(due) {
  if (!due) return { text: "Sem data", tone: "text-ink-mute" };
  const days = Math.ceil((due - new Date()) / 86400000);
  if (days < 0) return { text: `Atrasada ${-days}d`, tone: "text-rose-600 font-semibold" };
  if (days === 0) return { text: "Vence hoje", tone: "text-amber-600 font-semibold" };
  if (days === 1) return { text: "Vence amanhã", tone: "text-amber-600" };
  return { text: due.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }), tone: "text-ink-soft" };
}

export default function TasksPage() {
  const { loading, posts, clientById, members, memberById, user, deadlines, openEditor, href, workspace } = useWorkspace();
  const [person, setPerson] = useState(user.id);
  const [stageFilter, setStageFilter] = useState("");

  const all = useMemo(() => buildTasks(posts, deadlines), [posts, deadlines]);
  if (loading) return <Loading />;

  const mine = all.filter((t) => (person === "all" ? Boolean(t.assignee) : person === "none" ? !t.assignee : t.assignee === person) && (!stageFilter || t.stage === stageFilter));
  const me = memberById[user.id];
  const overdue = mine.filter((t) => t.status !== "in_review" && t.due && t.due < new Date()).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">{person === user.id ? "Minhas tarefas" : "Tarefas da equipe"}</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Etapas dos conteúdos por responsável{me?.functions?.length && person === user.id ? ` · ${me.functions.map((f) => FUNCTIONS[f]).join(", ")}` : ""}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select className="input w-auto py-2" value={person} onChange={(e) => setPerson(e.target.value)} aria-label="Pessoa">
            <option value={user.id}>Minhas tarefas</option>
            {workspace.role === "owner" && <option value="all">Toda a equipe</option>}
            {members.filter((m) => m.user_id !== user.id).map((m) => <option key={m.user_id} value={m.user_id}>{memberName(m)}</option>)}
            <option value="none">Sem responsável</option>
          </select>
          <select className="input w-auto py-2" value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} aria-label="Etapa">
            <option value="">Todas as etapas</option>
            <option value="theme">Tema</option>
            <option value="content">Conteúdo</option>
            <option value="media">Mídia</option>
            <option value="caption">Legenda</option>
          </select>
        </div>
      </div>

      {members.length <= 1 && (
        <div className="card flex flex-wrap items-center gap-3 p-4 text-sm">
          <span className="text-ink-soft">Você ainda está sozinha(o) na equipe. Convide designer, copy e outros em</span>
          <Link href={href("/configuracoes")} className="font-semibold text-brand hover:underline">Configurações → Equipe</Link>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {[
          ["Ajustes", mine.filter((t) => t.status === "changes_requested").length, "text-rose-600"],
          ["A fazer", mine.filter((t) => t.status === "draft").length, "text-ink"],
          ["Atrasadas", overdue, overdue ? "text-rose-600" : "text-ink"],
        ].map(([l, n, c]) => (
          <div key={l} className="card p-4">
            <div className={`text-2xl font-bold ${c}`}>{n}</div>
            <div className="text-xs text-ink-mute">{l}</div>
          </div>
        ))}
      </div>

      {TASK_GROUPS.map((g) => {
        const items = mine.filter((t) => t.status === g.key).sort(sortByDue);
        return (
          <section key={g.key}>
            <h2 className="mb-2 flex items-center gap-2 font-bold">
              {g.key === "changes_requested" ? <MessageSquareWarning size={17} className="text-rose-500" /> : g.key === "draft" ? <CalendarClock size={17} className="text-brand" /> : <CheckCircle2 size={17} className="text-amber-500" />}
              {g.label}
              <span className="rounded-full bg-paper px-2 text-xs text-ink-mute ring-1 ring-line">{items.length}</span>
            </h2>
            {items.length === 0 ? (
              <div className="card p-5 text-sm text-ink-mute">{g.empty}</div>
            ) : (
              <div className="card divide-y divide-line">
                {items.map((t) => {
                  const client = clientById[t.post.client_id];
                  const due = dueLabel(t.status === "in_review" ? null : t.due);
                  const st = STAGE_STATUSES[t.status];
                  return (
                    <button key={t.id} onClick={() => openEditor({ ...t.post, _stage: t.stage })} className={`flex w-full items-center gap-3 p-3 text-left transition hover:bg-paper ${t.blockedBy ? "opacity-60" : ""}`}>
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-paper">
                        {t.post.media?.[0] ? <MediaView item={t.post.media[0]} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><Avatar client={client} size={30} /></div>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="chip bg-navy text-white">{t.stageLabel}</span>
                          <span className="truncate text-sm font-semibold">{t.post.title || t.post.theme?.split("\n")[0] || FORMATS[t.post.format]}</span>
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-ink-mute">
                          <span>{client?.name}</span>
                          {t.post.scheduled_at && <span>· publica {new Date(t.post.scheduled_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</span>}
                          {t.blockedBy && <span className="flex items-center gap-1"><Lock size={11} /> aguardando {t.blockedBy}</span>}
                        </div>
                      </div>
                      <div className="hidden text-right text-xs sm:block">
                        <span className={`chip ${st.color}`}>{st.label}</span>
                        {t.status !== "in_review" && <div className={`mt-1 flex items-center justify-end gap-1 ${due.tone}`}>{due.text.startsWith("Atrasada") && <AlertTriangle size={12} />}{due.text}</div>}
                      </div>
                      {person !== user.id && <MemberAvatar member={memberById[t.assignee]} size={26} />}
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
