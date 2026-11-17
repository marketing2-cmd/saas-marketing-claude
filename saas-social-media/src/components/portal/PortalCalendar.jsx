"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MediaView } from "../PostPreview";
import { STATUSES, sameDay } from "@/lib/posts";

// Calendário do portal: só posts que o cliente pode ver; clique abre o post
export default function PortalCalendar({ posts, onOpen }) {
  const [cursor, setCursor] = useState(() => new Date());
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const start = new Date(first);
  start.setDate(1 - first.getDay());
  const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
  const cells = Math.ceil((first.getDay() + last.getDate()) / 7) * 7;
  const days = Array.from({ length: cells }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  const title = cursor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const today = new Date();

  return (
    <div>
      <div className="mb-3 flex items-center justify-center gap-2">
        <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="rounded-lg p-2 hover:bg-white" aria-label="Mês anterior"><ChevronLeft size={18} /></button>
        <div className="min-w-[180px] text-center text-lg font-bold">{title.charAt(0).toUpperCase() + title.slice(1)}</div>
        <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="rounded-lg p-2 hover:bg-white" aria-label="Próximo mês"><ChevronRight size={18} /></button>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-7 gap-1.5 pb-1.5 text-center text-[11px] font-semibold text-ink-mute">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((day) => {
              const outside = day.getMonth() !== cursor.getMonth();
              const items = posts.filter((p) => p.scheduled_at && sameDay(new Date(p.scheduled_at), day));
              return (
                <div key={day.toISOString()} className={`min-h-[96px] rounded-xl border p-1.5 ${outside ? "border-transparent bg-paper/60" : "border-line bg-white"}`}>
                  <div className={`mb-1 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${sameDay(day, today) ? "bg-brand text-white" : outside ? "text-ink-mute/60" : "text-ink-soft"}`}>{day.getDate()}</div>
                  <div className="space-y-1">
                    {items.map((p) => (
                      <button key={p.id} onClick={() => onOpen(p)} className="flex w-full items-center gap-1 rounded-lg border border-line bg-white p-1 text-left hover:border-brand-ring">
                        <div className="h-6 w-6 shrink-0 overflow-hidden rounded bg-paper">{p.media?.[0] && <MediaView item={p.media[0]} className="h-full w-full object-cover" />}</div>
                        <div className="min-w-0">
                          <div className="truncate text-[10px] font-semibold">{p.title || p.theme || "Conteúdo"}</div>
                          <div className="flex items-center gap-1 text-[9px] font-semibold" style={{ color: STATUSES[p.status]?.accent }}>
                            <span className={`h-1.5 w-1.5 rounded-full ${STATUSES[p.status]?.dot}`} />{STATUSES[p.status]?.label}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
