"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Grid3x3, LayoutList, Plus, Search } from "lucide-react";
import { useWorkspace } from "../WorkspaceProvider";
import { MediaView } from "../PostPreview";
import FeedGrid from "../FeedGrid";
import { FORMATS, STATUSES, sameDay } from "@/lib/posts";

const WEEK = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const COUNTERS = [
  { key: "draft", label: "Rascunho", color: "#94A3B8" },
  { key: "in_review", label: "Em aprovação", color: "#F5A524" },
  { key: "changes_requested", label: "Ajuste", color: "#F2557A" },
  { key: "approved", label: "Aprovado", color: "#22B07D", also: ["scheduled", "publishing", "published"] },
];
const NETWORKS = { instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok" };

function startOfWeek(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - x.getDay());
  return x;
}

export default function ClientContent({ client }) {
  const { posts, openEditor } = useWorkspace();
  const [view, setView] = useState("calendar");
  const [cursor, setCursor] = useState(() => new Date());
  const [query, setQuery] = useState("");
  const [network, setNetwork] = useState("");
  const [status, setStatus] = useState("");
  const [format, setFormat] = useState("");

  const clientPosts = useMemo(() => posts.filter((p) => p.client_id === client.id), [posts, client.id]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clientPosts.filter(
      (p) =>
        (!q || `${p.title} ${p.caption}`.toLowerCase().includes(q)) &&
        (!network || (p.networks || ["instagram"]).includes(network)) &&
        (!status || p.status === status) &&
        (!format || p.format === format)
    );
  }, [clientPosts, query, network, status, format]);

  const monthPosts = clientPosts.filter((p) => {
    if (!p.scheduled_at) return false;
    const d = new Date(p.scheduled_at);
    return d.getFullYear() === cursor.getFullYear() && d.getMonth() === cursor.getMonth();
  });

  const days = useMemo(() => {
    if (view === "week") {
      const s = startOfWeek(cursor);
      return Array.from({ length: 7 }, (_, i) => new Date(s.getFullYear(), s.getMonth(), s.getDate() + i));
    }
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const s = startOfWeek(first);
    const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    const cells = Math.ceil((first.getDay() + last.getDate()) / 7) * 7;
    return Array.from({ length: cells }, (_, i) => new Date(s.getFullYear(), s.getMonth(), s.getDate() + i));
  }, [cursor, view]);

  function shift(dir) {
    const d = new Date(cursor);
    if (view === "week") d.setDate(d.getDate() + 7 * dir);
    else d.setMonth(d.getMonth() + dir, 1);
    setCursor(d);
  }

  const today = new Date();
  const monthTitle = (() => {
    const s = cursor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    return s.charAt(0).toUpperCase() + s.slice(1);
  })();
  const weekTitle = view === "week" ? `${days[0].toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} – ${days[6].toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}` : null;

  function newOn(day) {
    const d = new Date(day);
    d.setHours(10, 0, 0, 0);
    openEditor({ client_id: client.id, scheduled_at: d.toISOString() });
  }

  const dayPosts = (day) =>
    filtered.filter((p) => p.scheduled_at && sameDay(new Date(p.scheduled_at), day)).sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
  const undated = filtered.filter((p) => !p.scheduled_at);

  return (
    <div className="space-y-4">
      {/* Mês + contadores */}
      <div className="card flex flex-wrap items-center justify-between gap-4 px-5 py-4">
        <div className="flex items-center gap-2">
          <button onClick={() => shift(-1)} className="rounded-lg p-2 text-ink-soft hover:bg-paper" aria-label="Anterior"><ChevronLeft size={18} /></button>
          <div className="min-w-[170px] text-center">
            <div className="text-lg font-bold">{monthTitle}</div>
            {weekTitle && <div className="text-xs text-ink-mute">{weekTitle}</div>}
          </div>
          <button onClick={() => shift(1)} className="rounded-lg p-2 text-ink-soft hover:bg-paper" aria-label="Próximo"><ChevronRight size={18} /></button>
          <button onClick={() => setCursor(new Date())} className="btn-ghost ml-1 px-3 py-1.5 text-xs">Hoje</button>
        </div>
        <div className="flex gap-6">
          {COUNTERS.map((c) => (
            <button key={c.key} onClick={() => setStatus(status === c.key ? "" : c.key)} className={`rounded-xl px-2 py-1 text-center transition hover:bg-paper ${status === c.key ? "bg-paper ring-1 ring-line" : ""}`}>
              <div className="text-2xl font-bold" style={{ color: c.color }}>{monthPosts.filter((p) => p.status === c.key || c.also?.includes(p.status)).length}</div>
              <div className="text-[11px] text-ink-mute">{c.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Filtros */}
      <div className="card flex flex-wrap gap-2 p-3">
        <div className="relative min-w-[220px] flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" />
          <input className="input pl-9" placeholder="Buscar por título ou legenda…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <select className="input w-auto" value={network} onChange={(e) => setNetwork(e.target.value)} aria-label="Canal">
          <option value="">Todos os canais</option>
          {Object.entries(NETWORKS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="">Todos os status</option>
          {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select className="input w-auto" value={format} onChange={(e) => setFormat(e.target.value)} aria-label="Formato">
          <option value="">Todos os formatos</option>
          {Object.entries(FORMATS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Visões */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {[["week", "Semanal", LayoutList], ["calendar", "Calendário", CalendarDays], ["feed", "Feed", Grid3x3]].map(([k, l, Icon]) => (
            <button key={k} onClick={() => setView(k)} className={`btn px-4 py-2 ${view === k ? "bg-brand text-white shadow-[0_6px_16px_-6px_rgba(124,92,252,.6)]" : "border border-line bg-white text-ink-soft hover:text-ink"}`}>
              <Icon size={16} /> {l}
            </button>
          ))}
        </div>
        <button onClick={() => openEditor({ client_id: client.id })} className="btn-primary"><Plus size={16} strokeWidth={2.5} /> Novo conteúdo</button>
      </div>

      {view === "feed" ? (
        <div className="mx-auto max-w-[560px]"><FeedGrid posts={filtered} onOpen={openEditor} /></div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-7 gap-2 pb-2 text-center text-xs font-semibold text-ink-mute">
              {WEEK.map((d) => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {days.map((day) => {
                const items = dayPosts(day);
                const outside = view === "calendar" && day.getMonth() !== cursor.getMonth();
                return (
                  <div key={day.toISOString()} className={`group rounded-2xl border p-2 ${view === "week" ? "min-h-[360px]" : "min-h-[120px]"} ${outside ? "border-transparent bg-paper/70" : "border-line bg-white"}`}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className={`flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-semibold ${sameDay(day, today) ? "bg-brand text-white" : outside ? "text-ink-mute/60" : "text-ink-soft"}`}>{day.getDate()}</span>
                      <button onClick={() => newOn(day)} className="rounded p-0.5 text-ink-mute opacity-0 transition hover:bg-brand-soft hover:text-brand group-hover:opacity-100" aria-label="Novo conteúdo neste dia"><Plus size={14} /></button>
                    </div>
                    <div className="space-y-1.5">
                      {items.map((p) => {
                        const st = STATUSES[p.status];
                        return (
                          <button key={p.id} onClick={() => openEditor(p)} className="block w-full overflow-hidden rounded-xl border border-line bg-white text-left shadow-sm transition hover:border-brand-ring hover:shadow-soft">
                            {view === "week" && p.media?.[0] && <MediaView item={p.media[0]} className="h-24 w-full object-cover" />}
                            <div className="p-1.5">
                              <div className="truncate text-[11px] font-semibold">{p.title || FORMATS[p.format]}</div>
                              <div className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold" style={{ color: st.accent }}>
                                <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                                {new Date(p.scheduled_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} · {st.label}
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

      {view !== "feed" && undated.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-bold">Sem data definida ({undated.length})</h3>
          <div className="flex flex-wrap gap-2">
            {undated.map((p) => (
              <button key={p.id} onClick={() => openEditor(p)} className="card px-3 py-2 text-left text-sm hover:border-brand-ring">
                <span className="font-semibold">{p.title || "Sem título"}</span> <span className="text-ink-mute">· {STATUSES[p.status].label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
