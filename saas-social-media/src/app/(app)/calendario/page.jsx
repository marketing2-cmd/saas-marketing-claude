"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useWorkspace } from "@/components/WorkspaceProvider";
import ClientFilter from "@/components/ClientFilter";
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

  const title = cursor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const today = new Date();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Calendário</h1>
        <div className="flex flex-wrap items-center gap-2">
          <ClientFilter value={clientId} onChange={setClientId} />
          <div className="flex rounded-lg border border-line bg-white p-0.5 text-sm">
            {[["month", "Mês"], ["week", "Semana"]].map(([k, l]) => (
              <button key={k} onClick={() => setView(k)} className={`rounded-md px-3 py-1 font-medium ${view === k ? "bg-brand-soft text-brand" : "text-ink-soft"}`}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button onClick={() => shift(-1)} className="btn-ghost px-2" aria-label="Anterior"><ChevronLeft size={16} /></button>
        <button onClick={() => setCursor(new Date())} className="btn-ghost px-3">Hoje</button>
        <button onClick={() => shift(1)} className="btn-ghost px-2" aria-label="Próximo"><ChevronRight size={16} /></button>
        <span className="ml-2 text-lg font-semibold capitalize">{title}</span>
      </div>

      {loading ? null : (
        <div className="mt-4 overflow-x-auto">
          <div className="card min-w-[720px] overflow-hidden">
            <div className="grid grid-cols-7 border-b border-line bg-paper text-center text-xs font-semibold uppercase text-ink-mute">
              {WEEKDAYS.map((d) => <div key={d} className="py-2">{d}</div>)}
            </div>
            <div className="grid grid-cols-7">
              {days.map((day) => {
                const dayPosts = visible
                  .filter((p) => sameDay(new Date(p.scheduled_at), day))
                  .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
                const outside = view === "month" && day.getMonth() !== cursor.getMonth();
                return (
                  <div key={day.toISOString()} className={`group border-b border-r border-line p-1.5 ${view === "week" ? "min-h-[360px]" : "min-h-[110px]"} ${outside ? "bg-paper/60" : ""}`}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${sameDay(day, today) ? "bg-brand text-white" : outside ? "text-ink-mute" : "text-ink-soft"}`}>
                        {day.getDate()}
                      </span>
                      <button onClick={() => newOn(day)} className="rounded p-0.5 text-ink-mute opacity-0 hover:bg-brand-soft hover:text-brand group-hover:opacity-100" aria-label="Novo post neste dia">
                        <Plus size={14} />
                      </button>
                    </div>
                    <div className="space-y-1">
                      {dayPosts.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => openEditor(p)}
                          className="flex w-full items-center gap-1.5 truncate rounded-md border border-line bg-white px-1.5 py-1 text-left text-[11px] hover:border-brand"
                          style={{ borderLeft: `3px solid ${clientById[p.client_id]?.color || "#6D4AFF"}` }}
                        >
                          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUSES[p.status].dot}`} />
                          <span className="font-semibold">{new Date(p.scheduled_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                          <span className="truncate">{p.title || clientById[p.client_id]?.name}</span>
                        </button>
                      ))}
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
              <button key={p.id} onClick={() => openEditor(p)} className="card px-3 py-2 text-left text-sm hover:border-brand">
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
