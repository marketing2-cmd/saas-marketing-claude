"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useWorkspace } from "@/components/WorkspaceProvider";
import ClientFilter from "@/components/ClientFilter";
import { MediaView } from "@/components/PostPreview";
import { STATUSES, sameDay } from "@/lib/posts";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function CalendarPage() {
  const { loading, posts, clientById, openEditor } = useWorkspace();
  const [view, setView] = useState("month");
  const [cursor, setCursor] = useState(() => new Date());
  const [clientId, setClientId] = useState("");

  const days = useMemo(() => {
    const start = new Date(cursor);
    start.setHours(0, 0, 0, 0);
    if (view === "month") {
      start.setDate(1);
      start.setDate(1 - start.getDay());
      return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
    }
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }, [cursor, view]);

  const visible = posts.filter((p) => p.scheduled_at && (!clientId || p.client_id === clientId));
  const unscheduled = posts.filter((p) => !p.scheduled_at && (!clientId || p.client_id === clientId));

  function shift(dir) {
    const d = new Date(cursor);
    if (view === "month") d.setMonth(d.getMonth() + dir);
    else d.setDate(d.getDate() + 7 * dir);
    setCursor(d);
  }

  function newOn(day) {
    const d = new Date(day);
    d.setHours(10, 0, 0, 0);
    openEditor({ scheduled_at: d.toISOString(), ...(clientId ? { client_id: clientId } : {}) });
  }

  const rawTitle = cursor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const title = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
  const today = new Date();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Calendário de conteúdo</h1>
          <p className="mt-1 text-sm text-ink-soft">Visão semanal e mensal de tudo que vai ao ar.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ClientFilter value={clientId} onChange={setClientId} />
          <div className="flex rounded-xl border border-line bg-white p-1 text-sm">
            {[["month", "Mês"], ["week", "Semana"]].map(([k, l]) => (
              <button key={k} onClick={() => setView(k)} className={`rounded-lg px-3.5 py-1.5 font-semibold transition ${view === k ? "bg-navy text-white" : "text-ink-soft hover:text-ink"}`}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button onClick={() => shift(-1)} className="btn-ghost px-2" aria-label="Anterior"><ChevronLeft size={16} /></button>
        <button onClick={() => setCursor(new Date())} className="btn-ghost px-3">Hoje</button>
        <button onClick={() => shift(1)} className="btn-ghost px-2" aria-label="Próximo"><ChevronRight size={16} /></button>
        <span className="ml-2 text-lg font-bold">{title}</span>
      </div>

      {loading ? null : (
        <div className="mt-4 overflow-x-auto">
          <div className="card min-w-[760px] overflow-hidden">
            <div className="grid grid-cols-7 border-b border-line bg-paper text-center text-[11px] font-semibold uppercase tracking-wider text-ink-mute">
              {WEEKDAYS.map((d) => <div key={d} className="py-2">{d}</div>)}
            </div>
            <div className="grid grid-cols-7">
              {days.map((day) => {
                const dayPosts = visible
                  .filter((p) => sameDay(new Date(p.scheduled_at), day))
                  .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
                const outside = view === "month" && day.getMonth() !== cursor.getMonth();
                return (
                  <div key={day.toISOString()} className={`group border-b border-r border-line p-2 ${view === "week" ? "min-h-[420px]" : "min-h-[124px]"} ${outside ? "bg-paper/70" : ""}`}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${sameDay(day, today) ? "bg-brand text-white shadow-[0_4px_10px_-4px_rgba(124,92,252,.8)]" : outside ? "text-ink-mute/60" : "text-ink"}`}>
                        {day.getDate()}
                      </span>
                      <button onClick={() => newOn(day)} className="rounded p-0.5 text-ink-mute opacity-0 hover:bg-brand-soft hover:text-brand group-hover:opacity-100" aria-label="Novo post neste dia">
                        <Plus size={14} />
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {dayPosts.map((p) => {
                        const st = STATUSES[p.status];
                        const client = clientById[p.client_id];
                        return (
                          <button
                            key={p.id}
                            onClick={() => openEditor(p)}
                            className="block w-full overflow-hidden rounded-xl border border-line bg-white text-left shadow-sm transition hover:-translate-y-px hover:border-brand-ring hover:shadow-soft"
                          >
                            {view === "week" && p.media?.[0] && <MediaView item={p.media[0]} className="h-24 w-full object-cover" />}
                            <div className="flex items-center gap-1.5 p-1.5">
                              {view === "month" && (
                                <div className="h-6 w-6 shrink-0 overflow-hidden rounded-md" style={{ background: client?.color }}>
                                  {p.media?.[0] && <MediaView item={p.media[0]} className="h-full w-full object-cover" />}
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-[11px] font-semibold leading-tight">{p.title || client?.name}</div>
                                <div className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold" style={{ color: st.accent }}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                                  {new Date(p.scheduled_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} · {st.label}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-ink-soft">
        {Object.entries(STATUSES).map(([k, s]) => (
          <span key={k} className="flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${s.dot}`} />{s.label}</span>
        ))}
      </div>

      {unscheduled.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 font-bold">Sem data definida ({unscheduled.length})</h2>
          <div className="flex flex-wrap gap-2">
            {unscheduled.map((p) => (
              <button key={p.id} onClick={() => openEditor(p)} className="card px-3.5 py-2.5 text-left text-sm hover:border-brand-ring">
                <span className="font-semibold">{p.title || "Sem título"}</span>
                <span className="text-ink-mute"> · {clientById[p.client_id]?.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
