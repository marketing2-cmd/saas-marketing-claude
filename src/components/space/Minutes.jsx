"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Plus, Trash2, CheckCircle2, Circle, X, ArrowLeft } from "lucide-react";
import { useSpace } from "./store";
import { Avatar, Button, Popover, MenuItem, SectorPicker, MemberPicker, DueDate, Empty, cx } from "./ui";
import { formatLongDate, parseISODate } from "@/lib/space/model";

export function MinutesPage({ sectorId = null, openId, onOpenTask, embedded = false }) {
  const { data, actions } = useSpace();
  const [selected, setSelected] = useState(openId || null);
  useEffect(() => openId && setSelected(openId), [openId]);

  const list = data.minutes
    .filter((m) => !sectorId || m.sector_id === sectorId)
    .sort((a, b) => b.meeting_date.localeCompare(a.meeting_date) || b.created_at.localeCompare(a.created_at));
  const current = data.minutes.find((m) => m.id === selected);

  async function newMinute() {
    const m = await actions.createMinute(sectorId ? { sector_id: sectorId } : {});
    setSelected(m.id);
  }

  return (
    <div className={cx("flex gap-6", embedded ? "" : "mx-auto max-w-6xl")}>
      <div className={cx("w-full shrink-0 md:w-[280px]", current && "hidden md:block")}>
        <Button className="mb-3 w-full" onClick={newMinute}>
          <Plus size={15} /> Nova ata
        </Button>
        {list.length === 0 && (
          <Empty icon={FileText} title="Nenhuma ata ainda">
            Registre as reuniões: o que foi falado, o que foi decidido e quem faz o quê.
          </Empty>
        )}
        <div className="space-y-1">
          {list.map((m) => {
            const sector = data.sectors.find((s) => s.id === m.sector_id);
            return (
              <button
                key={m.id}
                onClick={() => setSelected(m.id)}
                className={cx("w-full rounded-lg px-3 py-2.5 text-left transition", selected === m.id ? "bg-brand-soft" : "hover:bg-hover")}
              >
                <p className="truncate text-sm font-semibold text-ink">{m.title || "Sem título"}</p>
                <p className="text-xs text-muted">
                  {parseISODate(m.meeting_date).toLocaleDateString("pt-BR")}
                  {sector && <> · {sector.name}</>}
                </p>
              </button>
            );
          })}
        </div>
      </div>
      <div className={cx("min-w-0 flex-1", !current && "hidden md:block")}>
        {current ? (
          <MinuteEditor key={current.id} minute={current} onBack={() => setSelected(null)} onOpenTask={onOpenTask} />
        ) : (
          list.length > 0 && <div className="flex h-60 items-center justify-center text-sm text-muted">Selecione uma ata ou crie uma nova.</div>
        )}
      </div>
    </div>
  );
}

function useDebouncedSave(value, save, delay = 600) {
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => save(value), delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
}

function AutoTextarea({ value, onChange, placeholder, className }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.height = "auto";
    ref.current.style.height = ref.current.scrollHeight + "px";
  }, [value]);
  return <textarea ref={ref} rows={3} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cx("w-full resize-none overflow-hidden bg-transparent text-[15px] leading-relaxed text-ink outline-none placeholder:text-faint", className)} />;
}

function MinuteEditor({ minute, onBack, onOpenTask }) {
  const { data, actions } = useSpace();
  const [title, setTitle] = useState(minute.title);
  const [notes, setNotes] = useState(minute.notes);
  const [decisions, setDecisions] = useState(minute.decisions);
  const [newAction, setNewAction] = useState("");
  useDebouncedSave(title, (v) => actions.updateMinute(minute.id, { title: v }));
  useDebouncedSave(notes, (v) => actions.updateMinute(minute.id, { notes: v }));
  useDebouncedSave(decisions, (v) => actions.updateMinute(minute.id, { decisions: v }));

  const participants = (minute.participants || []).map((id) => data.members.find((m) => m.id === id)).filter(Boolean);
  const actionsList = data.tasks.filter((t) => t.source_minute_id === minute.id).sort((a, b) => a.created_at.localeCompare(b.created_at));

  return (
    <article className="rounded-2xl border border-line bg-surface px-6 py-6 md:px-10 md:py-8">
      <div className="mb-2 flex items-center gap-2">
        <button onClick={onBack} className="rounded-md p-1 text-muted hover:bg-hover md:hidden">
          <ArrowLeft size={18} />
        </button>
        <span className="text-2xl">📝</span>
        <div className="flex-1" />
        <button
          onClick={() => confirm("Excluir esta ata? Os encaminhamentos continuam como tarefas.") && (actions.deleteMinute(minute.id), onBack())}
          className="rounded-md p-1.5 text-muted hover:bg-red-500/10 hover:text-red-400"
          title="Excluir ata"
        >
          <Trash2 size={16} />
        </button>
      </div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Título da reunião"
        className="w-full bg-transparent text-[28px] font-bold leading-tight text-ink outline-none placeholder:text-faint"
      />

      <div className="mt-4 grid grid-cols-[110px_1fr] items-center gap-y-2 text-sm">
        <span className="text-muted">Data</span>
        <label className="relative w-fit cursor-pointer rounded-md px-1.5 py-1 text-ink hover:bg-hover">
          {formatLongDate(minute.meeting_date)}
          <input type="date" value={minute.meeting_date} onChange={(e) => e.target.value && actions.updateMinute(minute.id, { meeting_date: e.target.value })} className="absolute inset-0 opacity-0" />
        </label>
        <span className="text-muted">Setor</span>
        <SectorPicker value={minute.sector_id} onChange={(v) => actions.updateMinute(minute.id, { sector_id: v })} allowNone placeholder="Geral" />
        <span className="text-muted">Participantes</span>
        <div className="flex flex-wrap items-center gap-1">
          {participants.map((p) => (
            <span key={p.id} className="group inline-flex items-center gap-1.5 rounded-full bg-hover py-0.5 pl-0.5 pr-2 text-[13px]">
              <Avatar member={p} size={20} /> {p.name.split(" ")[0]}
              <button onClick={() => actions.updateMinute(minute.id, { participants: minute.participants.filter((x) => x !== p.id) })} className="hidden text-muted group-hover:inline">
                <X size={12} />
              </button>
            </span>
          ))}
          <Popover trigger={<button className="rounded-full p-1 text-muted hover:bg-hover"><Plus size={15} /></button>}>
            {(close) =>
              data.members
                .filter((m) => !(minute.participants || []).includes(m.id))
                .map((m) => (
                  <MenuItem key={m.id} onClick={() => (actions.updateMinute(minute.id, { participants: [...(minute.participants || []), m.id] }), close())}>
                    <Avatar member={m} size={22} /> {m.name}
                  </MenuItem>
                ))
            }
          </Popover>
        </div>
      </div>

      <hr className="my-6 border-line" />

      <h3 className="mb-1 text-[17px] font-bold text-ink">Pauta e anotações</h3>
      <AutoTextarea value={notes} onChange={setNotes} placeholder="O que foi conversado…" />

      <h3 className="mb-1 mt-6 text-[17px] font-bold text-ink">Decisões</h3>
      <AutoTextarea value={decisions} onChange={setDecisions} placeholder="O que ficou decidido…" className="rounded-lg bg-amber-400/10 px-3 py-2" />

      <h3 className="mb-1 mt-6 text-[17px] font-bold text-ink">Encaminhamentos</h3>
      <p className="mb-2 text-[13px] text-muted">Cada encaminhamento vira uma tarefa e aparece para o responsável.</p>
      <div className="divide-y divide-line rounded-lg border border-line">
        {actionsList.map((t) => (
          <div key={t.id} className="flex items-center gap-2.5 px-3 py-2">
            <button onClick={() => actions.updateTask(t.id, { status: t.status === "done" ? "todo" : "done" })}>
              {t.status === "done" ? <CheckCircle2 size={18} className="text-[#00A86B]" /> : <Circle size={18} className="text-faint" />}
            </button>
            <button onClick={() => onOpenTask?.(t.id)} className={cx("flex-1 truncate text-left text-sm hover:underline", t.status === "done" && "text-muted line-through")}>
              {t.title}
            </button>
            <MemberPicker value={t.assignee_id} onChange={(v) => actions.updateTask(t.id, { assignee_id: v })} size={24} />
            <DueDate value={t.due_date} onChange={(v) => actions.updateTask(t.id, { due_date: v })} done={t.status === "done"} />
          </div>
        ))}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newAction.trim()) return;
            actions.createTask({ title: newAction.trim(), sector_id: minute.sector_id, source_minute_id: minute.id, assignee_id: null });
            setNewAction("");
          }}
          className="flex items-center gap-2 px-3 py-2 text-muted"
        >
          <Plus size={16} />
          <input value={newAction} onChange={(e) => setNewAction(e.target.value)} placeholder="Novo encaminhamento (Enter para adicionar)" className="flex-1 bg-transparent text-sm text-ink outline-none" />
        </form>
      </div>
    </article>
  );
}
