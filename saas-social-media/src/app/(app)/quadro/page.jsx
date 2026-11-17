"use client";

import { useState } from "react";
import { useWorkspace } from "@/components/WorkspaceProvider";
import ClientFilter from "@/components/ClientFilter";
import { Avatar, MediaView } from "@/components/PostPreview";
import MemberAvatar from "@/components/MemberAvatar";
import { BOARD_COLUMNS, STAGES, STAGE_STATUSES, STATUSES, currentStage, formatDateTime, getAssignees, getStages } from "@/lib/posts";
import { memberName } from "@/lib/team";

const STAGE_COLUMNS = [
  ...STAGES.map((s) => ({ key: s.key, label: s.label, color: "#7C5CFC" })),
  { key: "review", label: "Aguardando cliente", color: "#F5A524" },
  { key: "done", label: "Pronto para publicar", color: "#22B07D" },
  { key: "published", label: "Publicado", color: "#0EA5E9" },
];

export default function BoardPage() {
  const { loading, posts, clientById, openEditor, setPostStatus, members, memberById } = useWorkspace();
  const [clientId, setClientId] = useState("");
  const [view, setView] = useState("status");
  const [person, setPerson] = useState("");
  const [dragging, setDragging] = useState(null);
  const [over, setOver] = useState(null);

  const visible = posts.filter((p) => {
    if (clientId && p.client_id !== clientId) return false;
    if (!person) return true;
    const as = getAssignees(p);
    if (view === "stage") {
      const cur = currentStage(p);
      return as[cur] === person;
    }
    return Object.values(as).includes(person);
  });
  const columns = [...BOARD_COLUMNS];
  ["publishing", "failed"].forEach((s) => visible.some((p) => p.status === s) && columns.push(s));

  async function drop(status) {
    const post = posts.find((p) => p.id === dragging);
    setDragging(null);
    setOver(null);
    if (!post || post.status === status || status === "published" || status === "failed" || status === "publishing") return;
    await setPostStatus(post, status);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Quadro de tarefas</h1>
          <p className="mt-1 text-sm text-ink-soft">{view === "status" ? "Arraste os cards para mudar o status." : "Cada conteúdo aparece na etapa em que está parado, com o responsável dela."}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex rounded-xl border border-line bg-white p-1 text-sm">
            {[["status", "Por status"], ["stage", "Por etapa"]].map(([k, l]) => (
              <button key={k} onClick={() => setView(k)} className={`rounded-lg px-3.5 py-1.5 font-semibold transition ${view === k ? "bg-navy text-white" : "text-ink-soft hover:text-ink"}`}>{l}</button>
            ))}
          </div>
          {members.length > 1 && (
            <select className="input w-auto py-1.5" value={person} onChange={(e) => setPerson(e.target.value)} aria-label="Filtrar por pessoa">
              <option value="">Todas as pessoas</option>
              {members.map((m) => <option key={m.user_id} value={m.user_id}>{memberName(m)}</option>)}
            </select>
          )}
          <ClientFilter value={clientId} onChange={setClientId} />
        </div>
      </div>

      {!loading && view === "stage" && (
        <div className="mt-6 flex gap-4 overflow-x-auto pb-4">
          {STAGE_COLUMNS.map((col) => {
            const items = visible.filter((p) => currentStage(p) === col.key);
            return (
              <div key={col.key} className="w-[280px] shrink-0 rounded-2xl bg-[#EFEDF6] p-2.5">
                <div className="flex items-center justify-between px-1.5 py-1">
                  <span className="chip bg-white text-xs shadow-sm" style={{ color: col.color }}>
                    <span className="h-2 w-2 rounded-full" style={{ background: col.color }} />{col.label}
                  </span>
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-1.5 text-xs font-bold text-ink-soft shadow-sm">{items.length}</span>
                </div>
                <div className="mt-1 space-y-2">
                  {items.map((p) => {
                    const cur = currentStage(p);
                    const isStage = STAGES.some((s) => s.key === cur);
                    const st = isStage ? STAGE_STATUSES[getStages(p)[cur]] : null;
                    const assignee = isStage ? memberById[getAssignees(p)[cur]] : null;
                    return (
                      <div key={p.id} onClick={() => openEditor(isStage ? { ...p, _stage: cur } : p)} className="card cursor-pointer overflow-hidden transition hover:-translate-y-0.5 hover:shadow-float">
                        {p.media?.[0] && <MediaView item={p.media[0]} className="h-28 w-full object-cover" />}
                        <div className="p-3">
                          <div className="flex items-center gap-2 text-xs text-ink-soft">
                            <Avatar client={clientById[p.client_id]} size={18} />
                            <span className="truncate">{clientById[p.client_id]?.name}</span>
                          </div>
                          <div className="mt-1.5 line-clamp-2 text-sm font-semibold">{p.title || p.theme || p.caption || "Sem título"}</div>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            {st ? <span className={`chip ${st.color}`}><span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />{st.label}</span> : <span className="text-xs text-ink-mute">{formatDateTime(p.scheduled_at)}</span>}
                            {isStage && members.length > 0 && <MemberAvatar member={assignee} size={24} />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && view === "status" && (
        <div className="mt-6 flex gap-4 overflow-x-auto pb-4">
          {columns.map((status) => {
            const items = visible.filter((p) => p.status === status);
            return (
              <div
                key={status}
                onDragOver={(e) => { e.preventDefault(); setOver(status); }}
                onDragLeave={() => setOver(null)}
                onDrop={() => drop(status)}
                className={`w-[280px] shrink-0 rounded-2xl p-2.5 transition ${over === status ? "bg-brand-soft ring-2 ring-brand-ring" : "bg-[#EFEDF6]"}`}
              >
                <div className="flex items-center justify-between px-1.5 py-1">
                  <span className="chip bg-white text-xs shadow-sm" style={{ color: STATUSES[status].accent }}>
                    <span className={`h-2 w-2 rounded-full ${STATUSES[status].dot}`} />{STATUSES[status].label}
                  </span>
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-1.5 text-xs font-bold text-ink-soft shadow-sm">{items.length}</span>
                </div>
                <div className="mt-1 space-y-2">
                  {items.map((p) => (
                    <div
                      key={p.id}
                      draggable={!["published", "publishing"].includes(p.status)}
                      onDragStart={() => setDragging(p.id)}
                      onClick={() => openEditor(p)}
                      className="card cursor-grab overflow-hidden transition hover:-translate-y-0.5 hover:shadow-float active:cursor-grabbing"
                    >
                      {p.media?.[0] && <MediaView item={p.media[0]} className="h-36 w-full object-cover" />}
                      <div className="p-3">
                        <div className="flex items-center gap-2 text-xs text-ink-soft">
                          <Avatar client={clientById[p.client_id]} size={18} />
                          <span className="truncate">{clientById[p.client_id]?.name}</span>
                        </div>
                        <div className="mt-1.5 line-clamp-2 text-sm font-semibold">{p.title || p.caption || "Sem título"}</div>
                        <div className="mt-1.5 text-xs text-ink-mute">{formatDateTime(p.scheduled_at)}</div>
                        {p.tags?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {p.tags.map((t) => <span key={t} className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold text-brand">#{t}</span>)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
