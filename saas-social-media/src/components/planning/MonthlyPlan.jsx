"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Flag, Plus, Trash2 } from "lucide-react";
import { useWorkspace } from "../WorkspaceProvider";
import SaveBar from "./SaveBar";
import Loading from "../Loading";
import { STATUSES } from "@/lib/posts";
import { monthLabel, monthStart, shiftMonth, uid, weeksInMonth } from "@/lib/planning";

export default function MonthlyPlan({ client }) {
  const { getMonthlyPlan, saveMonthlyPlan, posts, notify } = useWorkspace();
  const [month, setMonth] = useState(() => monthStart());
  const [plan, setPlan] = useState(null);
  const [saved, setSaved] = useState(null);
  const [saving, setSaving] = useState(false);
  const dirty = plan !== null && JSON.stringify(plan) !== saved;

  useEffect(() => {
    let alive = true;
    setPlan(null);
    getMonthlyPlan(client.id, month).then((p) => {
      if (!alive) return;
      const weeks = Array.from({ length: weeksInMonth(month) }, (_, i) => p.weeks?.[i] || "");
      const normalized = { theme: p.theme, goals: p.goals, weeks, key_dates: p.key_dates || [] };
      setPlan(normalized);
      setSaved(JSON.stringify(normalized));
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client.id, month]);

  function changeMonth(delta) {
    if (dirty && !confirm("Descartar as alterações deste mês?")) return;
    setMonth((m) => shiftMonth(m, delta));
  }

  async function save() {
    setSaving(true);
    const res = await saveMonthlyPlan(client.id, month, plan);
    setSaving(false);
    if (res) {
      setSaved(JSON.stringify(plan));
      notify(`Plano de ${monthLabel(month).toLowerCase()} salvo.`);
    }
  }

  const set = (patch) => setPlan((p) => ({ ...p, ...patch }));
  const [y, m] = month.split("-").map(Number);
  const monthPosts = posts.filter((p) => {
    if (p.client_id !== client.id || !p.scheduled_at) return false;
    const d = new Date(p.scheduled_at);
    return d.getFullYear() === y && d.getMonth() + 1 === m;
  });

  return (
    <div className="space-y-5 pb-24">
      <div className="flex items-center gap-2">
        <button onClick={() => changeMonth(-1)} className="btn-ghost px-2.5" aria-label="Mês anterior"><ChevronLeft size={16} /></button>
        <div className="min-w-[180px] text-center text-lg font-bold">{monthLabel(month)}</div>
        <button onClick={() => changeMonth(1)} className="btn-ghost px-2.5" aria-label="Próximo mês"><ChevronRight size={16} /></button>
      </div>

      {!plan ? <Loading /> : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5">
            <section className="card space-y-4 p-5">
              <div>
                <label className="label">Tema / campanha do mês</label>
                <input className="input" placeholder="Ex.: Mês do aniversário da marca" value={plan.theme} onChange={(e) => set({ theme: e.target.value })} />
              </div>
              <div>
                <label className="label">Objetivos do mês</label>
                <textarea className="input resize-y" rows={3} placeholder="Ex.: 300 pedidos pelo direct, lançar o novo sabor…" value={plan.goals} onChange={(e) => set({ goals: e.target.value })} />
              </div>
            </section>

            <section className="card p-5">
              <h3 className="font-bold">Foco de cada semana</h3>
              <div className="mt-3 space-y-2.5">
                {plan.weeks.map((w, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-20 shrink-0 text-xs font-bold uppercase tracking-wider text-ink-mute">Semana {i + 1}</span>
                    <input className="input" placeholder="Ex.: teaser do lançamento" value={w} onChange={(e) => set({ weeks: plan.weeks.map((x, k) => (k === i ? e.target.value : x)) })} />
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-5">
            <section className="card p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold">Datas importantes</h3>
                <button onClick={() => set({ key_dates: [...plan.key_dates, { id: uid(), date: `${month.slice(0, 8)}01`, title: "" }] })} className="btn-ghost px-2.5 py-1.5 text-xs"><Plus size={14} /> Data</button>
              </div>
              <div className="mt-3 space-y-2">
                {plan.key_dates.length === 0 && <p className="text-sm text-ink-mute">Feriados, datas comemorativas, eventos e lançamentos.</p>}
                {[...plan.key_dates].sort((a, b) => a.date.localeCompare(b.date)).map((d) => (
                  <div key={d.id} className="rounded-xl border border-line p-2.5">
                    <div className="flex items-center gap-2">
                      <Flag size={14} className="shrink-0 text-brand" />
                      <input type="date" className="input flex-1 px-2 py-1.5 text-xs" value={d.date} onChange={(e) => set({ key_dates: plan.key_dates.map((x) => (x.id === d.id ? { ...x, date: e.target.value } : x)) })} aria-label="Data" />
                      <button onClick={() => set({ key_dates: plan.key_dates.filter((x) => x.id !== d.id) })} className="shrink-0 rounded-lg p-1.5 text-ink-mute hover:bg-rose-50 hover:text-rose-600" aria-label="Remover data"><Trash2 size={14} /></button>
                    </div>
                    <input className="input mt-2 py-2 text-sm" placeholder="O que acontece (ex.: Black Friday)" value={d.title} onChange={(e) => set({ key_dates: plan.key_dates.map((x) => (x.id === d.id ? { ...x, title: e.target.value } : x)) })} />
                  </div>
                ))}
              </div>
            </section>

            <section className="card p-5">
              <h3 className="font-bold">Posts deste mês</h3>
              <p className="text-xs text-ink-mute">{monthPosts.length} no calendário</p>
              <div className="mt-3 space-y-1.5">
                {Object.entries(STATUSES).map(([k, st]) => {
                  const n = monthPosts.filter((p) => p.status === k).length;
                  if (!n) return null;
                  return (
                    <div key={k} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${st.dot}`} />{st.label}</span>
                      <b>{n}</b>
                    </div>
                  );
                })}
                {monthPosts.length === 0 && <p className="text-sm text-ink-mute">Nenhum post ainda. Use “Gerar rascunhos do mês” no cronograma semanal.</p>}
              </div>
            </section>
          </div>
        </div>
      )}

      <SaveBar dirty={dirty} saving={saving} onSave={save} onDiscard={() => setPlan(JSON.parse(saved))} />
    </div>
  );
}
