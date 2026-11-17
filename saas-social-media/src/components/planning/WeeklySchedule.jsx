"use client";

import { useState } from "react";
import { CalendarPlus, Clock, Plus, Trash2 } from "lucide-react";
import { useWorkspace } from "../WorkspaceProvider";
import Dialog from "../Dialog";
import PillarChip from "./PillarChip";
import { FORMATS } from "@/lib/posts";
import { WEEKDAYS, monthLabel, monthStart, scheduleOccurrences, shiftMonth, sortSlots, uid } from "@/lib/planning";

export default function WeeklySchedule({ client, strategy, update, dirty }) {
  const { posts, createDraftPosts, notify } = useWorkspace();
  const [editing, setEditing] = useState(null);
  const [generating, setGenerating] = useState(false);
  const schedule = strategy.weekly_schedule || [];
  const pillars = strategy.pillars || [];
  const pillarById = Object.fromEntries(pillars.map((p) => [p.id, p]));

  function saveSlot(slot) {
    update((s) => {
      const list = s.weekly_schedule || [];
      return { weekly_schedule: list.some((x) => x.id === slot.id) ? list.map((x) => (x.id === slot.id ? slot : x)) : [...list, slot] };
    });
    setEditing(null);
  }
  function removeSlot(id) {
    update((s) => ({ weekly_schedule: (s.weekly_schedule || []).filter((x) => x.id !== id) }));
    setEditing(null);
  }

  // Distribuição real do cronograma por pilar vs. meta da linha editorial
  const byPillar = pillars.map((p) => ({ ...p, count: schedule.filter((s) => s.pillar_id === p.id).length }));
  const totalSlots = schedule.length;

  return (
    <div className="space-y-5 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">
          A rotina fixa de publicação de <b>{client.name}</b>: <b>{totalSlots}</b> {totalSlots === 1 ? "publicação" : "publicações"} por semana.
        </p>
        <button onClick={() => setGenerating(true)} disabled={!totalSlots} className="btn-dark px-3 py-2">
          <CalendarPlus size={16} /> Gerar rascunhos do mês
        </button>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="grid min-w-[840px] grid-cols-7 gap-2">
          {WEEKDAYS.map((d) => {
            const slots = sortSlots(schedule.filter((s) => s.weekday === d.n));
            return (
              <div key={d.n} className="flex min-h-[220px] flex-col rounded-2xl bg-[#EFEDF6] p-2">
                <div className="px-1.5 pb-2 pt-1 text-xs font-bold uppercase tracking-wider text-ink-soft">{d.long}</div>
                <div className="flex-1 space-y-2">
                  {slots.map((slot) => (
                    <button key={slot.id} onClick={() => setEditing(slot)} className="card block w-full p-2.5 text-left transition hover:-translate-y-0.5 hover:shadow-float" style={{ borderLeft: `3px solid ${pillarById[slot.pillar_id]?.color || "#C9C6D9"}` }}>
                      <div className="flex items-center gap-1 text-xs font-bold"><Clock size={12} className="text-ink-mute" />{slot.time || "--:--"}</div>
                      <div className="mt-1 text-[11px] font-semibold text-brand">{FORMATS[slot.format] || "Post"}</div>
                      {pillarById[slot.pillar_id] && <div className="mt-1 truncate text-[11px] text-ink-soft">{pillarById[slot.pillar_id].name}</div>}
                      {slot.note && <div className="mt-1 line-clamp-2 text-[11px] text-ink-mute">{slot.note}</div>}
                    </button>
                  ))}
                </div>
                <button onClick={() => setEditing({ id: uid(), weekday: d.n, time: "10:00", format: "feed", pillar_id: pillars[0]?.id || null, note: "", isNew: true })} className="mt-2 flex items-center justify-center gap-1 rounded-xl py-2 text-xs font-semibold text-ink-mute transition hover:bg-white hover:text-brand">
                  <Plus size={14} /> Adicionar
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {pillars.length > 0 && totalSlots > 0 && (
        <section className="card p-5">
          <h3 className="font-bold">Cronograma × linha editorial</h3>
          <p className="mb-4 text-xs text-ink-mute">Quanto da semana cada pilar ocupa, comparado com a meta definida.</p>
          <div className="space-y-3">
            {byPillar.map((p) => {
              const real = totalSlots ? Math.round((p.count / totalSlots) * 100) : 0;
              const target = Number(p.share) || 0;
              const off = Math.abs(real - target) > 10;
              return (
                <div key={p.id}>
                  <div className="mb-1 flex items-baseline justify-between text-sm">
                    <span className="flex items-center gap-2 font-medium"><span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />{p.name || "Sem nome"}</span>
                    <span className="text-xs">
                      <b>{real}%</b> <span className="text-ink-mute">({p.count}/sem) · meta {target}%</span>
                      {off && <span className="ml-1 font-semibold text-amber-600">ajustar</span>}
                    </span>
                  </div>
                  <div className="relative h-2.5 w-full rounded-full bg-paper">
                    <div className="h-2.5 rounded-full" style={{ width: `${real}%`, background: p.color }} />
                    {target > 0 && <div className="absolute top-[-3px] h-4 w-0.5 rounded bg-ink" style={{ left: `calc(${Math.min(target, 100)}% - 1px)` }} title={`Meta ${target}%`} />}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {editing && (
        <SlotDialog slot={editing} pillars={pillars} onSave={saveSlot} onRemove={removeSlot} onClose={() => setEditing(null)} />
      )}
      {generating && (
        <GenerateDialog
          client={client}
          schedule={schedule}
          pillarById={pillarById}
          posts={posts}
          dirty={dirty}
          onClose={() => setGenerating(false)}
          onGenerate={async (drafts) => {
            const created = await createDraftPosts(drafts);
            if (created.length) notify(`${created.length} rascunhos criados no calendário.`);
            setGenerating(false);
          }}
        />
      )}
    </div>
  );
}

function SlotDialog({ slot, pillars, onSave, onRemove, onClose }) {
  const [draft, setDraft] = useState(slot);
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  return (
    <Dialog title={slot.isNew ? "Nova publicação fixa" : "Editar publicação fixa"} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const { isNew, ...clean } = draft;
          onSave(clean);
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Dia</label>
            <select className="input" value={draft.weekday} onChange={(e) => set({ weekday: Number(e.target.value) })}>
              {WEEKDAYS.map((d) => <option key={d.n} value={d.n}>{d.long}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Horário</label>
            <input type="time" className="input" value={draft.time} onChange={(e) => set({ time: e.target.value })} required />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Formato</label>
            <select className="input" value={draft.format} onChange={(e) => set({ format: e.target.value })}>
              {Object.entries(FORMATS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Pilar</label>
            <select className="input" value={draft.pillar_id || ""} onChange={(e) => set({ pillar_id: e.target.value || null })}>
              <option value="">Sem pilar</option>
              {pillars.map((p) => <option key={p.id} value={p.id}>{p.name || "Sem nome"}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Observação</label>
          <input className="input" placeholder="Ex.: destaque da semana, enquete…" value={draft.note} onChange={(e) => set({ note: e.target.value })} />
        </div>
        {pillars.length === 0 && <p className="text-xs text-ink-mute">Dica: crie pilares na aba <b>Linha editorial</b> para classificar o cronograma.</p>}
        <div className="flex justify-between gap-2 pt-1">
          {!slot.isNew ? (
            <button type="button" onClick={() => onRemove(slot.id)} className="btn px-3 text-rose-600 hover:bg-rose-50"><Trash2 size={16} /> Remover</button>
          ) : <span />}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-ghost">Cancelar</button>
            <button className="btn-primary">OK</button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}

function GenerateDialog({ client, schedule, pillarById, posts, dirty, onClose, onGenerate }) {
  const [month, setMonth] = useState(() => monthStart());
  const [busy, setBusy] = useState(false);
  const occurrences = scheduleOccurrences(schedule, month);
  // Evita duplicar: pula horários em que o cliente já tem post
  const taken = new Set(posts.filter((p) => p.client_id === client.id && p.scheduled_at).map((p) => new Date(p.scheduled_at).getTime()));
  const fresh = occurrences.filter((o) => !taken.has(o.when.getTime()));

  async function go() {
    setBusy(true);
    await onGenerate(
      fresh.map(({ slot, when }) => {
        const pillar = pillarById[slot.pillar_id];
        return {
          client_id: client.id,
          title: [pillar?.name, slot.note].filter(Boolean).join(" — ") || FORMATS[slot.format],
          format: slot.format,
          tags: pillar?.name ? [pillar.name] : [],
          scheduled_at: when.toISOString(),
        };
      })
    );
    setBusy(false);
  }

  return (
    <Dialog title="Gerar rascunhos a partir do cronograma" onClose={onClose}>
      <p className="text-sm text-ink-soft">Cria um rascunho no calendário para cada publicação fixa do mês escolhido, já com dia, horário, formato e pilar. Depois é só preencher legenda e mídia.</p>
      <div className="mt-4 flex items-center gap-2">
        <button onClick={() => setMonth((m) => shiftMonth(m, -1))} disabled={month <= monthStart()} className="btn-ghost px-3">‹</button>
        <div className="flex-1 text-center font-bold">{monthLabel(month)}</div>
        <button onClick={() => setMonth((m) => shiftMonth(m, 1))} className="btn-ghost px-3">›</button>
      </div>
      <div className="mt-4 rounded-2xl bg-paper p-4 text-sm">
        <b>{fresh.length}</b> rascunhos serão criados
        {occurrences.length !== fresh.length && <span className="text-ink-mute"> ({occurrences.length - fresh.length} já existem e serão pulados)</span>}
        <span className="text-ink-mute">. Datas que já passaram não entram.</span>
      </div>
      {dirty && <p className="mt-3 text-xs font-medium text-amber-600">Você tem alterações não salvas no cronograma — elas serão usadas na geração. Lembre de salvar.</p>}
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="btn-ghost">Cancelar</button>
        <button onClick={go} disabled={busy || !fresh.length} className="btn-primary">Criar {fresh.length} rascunhos</button>
      </div>
    </Dialog>
  );
}
