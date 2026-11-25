"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Plus, Repeat, Trash2 } from "lucide-react";
import { useSpace } from "./store";
import { Avatar, Button, Modal, Field, inputCls, SectorPicker, MemberPicker, Empty, cx } from "./ui";
import { FREQUENCIES, WEEKDAYS, periodKey, routineWhen, routineDueToday, formatTime } from "@/lib/space/model";

export function RoutineItem({ routine, showSector }) {
  const { data, actions } = useSpace();
  const key = periodKey(routine);
  const check = data.checks.find((c) => c.id === `${routine.id}:${key}`);
  const assignee = data.members.find((m) => m.id === routine.assignee_id);
  const doneBy = check && data.members.find((m) => m.id === check.done_by);
  const sector = data.sectors.find((s) => s.id === routine.sector_id);
  return (
    <div className="group flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-hover">
      <button onClick={() => actions.toggleCheck(routine, key, !check)} title={check ? "Desmarcar" : "Marcar como feita"}>
        {check ? <CheckCircle2 size={21} className="text-[#00A86B]" /> : <Circle size={21} className="text-[#C3C7D2] hover:text-[#00A86B]" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={cx("truncate text-sm text-ink", check && "text-muted line-through")}>{routine.title}</p>
        <p className="text-xs text-muted">
          {routineWhen(routine)}
          {showSector && sector ? ` · ${sector.name}` : ""}
          {check && ` · feito${doneBy ? ` por ${doneBy.name.split(" ")[0]}` : ""} às ${formatTime(check.done_at)}`}
        </p>
      </div>
      <Avatar member={assignee} size={24} />
    </div>
  );
}

export function RoutinesPage({ sectorId = null, embedded = false }) {
  const { data, me, actions } = useSpace();
  const [filter, setFilter] = useState(sectorId ? "sector" : "mine");
  const [creating, setCreating] = useState(false);

  let list = data.routines.filter((r) => r.active);
  if (sectorId) list = list.filter((r) => r.sector_id === sectorId);
  else if (filter === "mine") list = list.filter((r) => r.assignee_id === me?.id);

  const groups = FREQUENCIES.map((f) => ({ ...f, items: list.filter((r) => r.frequency === f.id) }));
  const today = list.filter((r) => routineDueToday(r));
  const done = today.filter((r) => data.checks.some((c) => c.id === `${r.id}:${periodKey(r)}`)).length;

  return (
    <div className={embedded ? "" : "mx-auto max-w-4xl"}>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        {!sectorId && (
          <div className="flex rounded-lg bg-hover p-0.5 text-sm">
            {[
              ["mine", "Minhas rotinas"],
              ["all", "Todas"],
            ].map(([id, label]) => (
              <button key={id} onClick={() => setFilter(id)} className={cx("rounded-md px-3 py-1 font-medium", filter === id ? "bg-white text-ink shadow-card" : "text-muted")}>
                {label}
              </button>
            ))}
          </div>
        )}
        {today.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-ink-2">
            <div className="h-1.5 w-28 overflow-hidden rounded-full bg-hover">
              <div className="h-full bg-[#00A86B] transition-all" style={{ width: `${(done / today.length) * 100}%` }} />
            </div>
            {done} de {today.length} feitas hoje
          </div>
        )}
        <div className="flex-1" />
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus size={15} /> Nova rotina
        </Button>
      </div>

      {list.length === 0 ? (
        <Empty icon={Repeat} title="Nenhuma rotina por aqui">
          Rotinas são as atividades que se repetem: conferir e-mails, relatório semanal, fechamento do mês…
        </Empty>
      ) : (
        <div className="space-y-5">
          {groups
            .filter((g) => g.items.length)
            .map((g) => (
              <section key={g.id} className="rounded-xl border border-line bg-white p-3">
                <h3 className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  {g.label} <span className="normal-case tracking-normal">· {g.hint}</span>
                </h3>
                {g.items.map((r) => (
                  <div key={r.id} className="group/item relative">
                    <RoutineItem routine={r} showSector={!sectorId} />
                    <button
                      onClick={() => confirm(`Excluir a rotina "${r.title}"?`) && actions.deleteRoutine(r.id)}
                      className="absolute right-11 top-1/2 -translate-y-1/2 rounded p-1 text-muted opacity-0 hover:text-red-600 group-hover/item:opacity-100"
                      title="Excluir rotina"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </section>
            ))}
        </div>
      )}
      {creating && <NewRoutineModal sectorId={sectorId} onClose={() => setCreating(false)} />}
    </div>
  );
}

function NewRoutineModal({ sectorId, onClose }) {
  const { data, me, actions } = useSpace();
  const mySector = data.members.find((m) => m.id === me?.id)?.sector_id || null;
  const [f, setF] = useState({ title: "", sector_id: sectorId || mySector, assignee_id: me?.id, frequency: "daily", weekday: 1, month_day: 1 });
  const set = (p) => setF((x) => ({ ...x, ...p }));
  const valid = f.title.trim() && f.sector_id;
  return (
    <Modal title="Nova rotina" onClose={onClose}>
      <form
        data-modal
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          actions.createRoutine({
            title: f.title.trim(),
            sector_id: f.sector_id,
            assignee_id: f.assignee_id,
            frequency: f.frequency,
            weekday: f.frequency === "weekly" ? Number(f.weekday) : null,
            month_day: f.frequency === "monthly" ? Number(f.month_day) : null,
          });
          onClose();
        }}
      >
        <Field label="O que precisa ser feito?">
          <input autoFocus value={f.title} onChange={(e) => set({ title: e.target.value })} className={inputCls} placeholder="Ex.: Conferir caixa de e-mail do setor" />
        </Field>
        <Field label="Com que frequência?">
          <div className="grid grid-cols-3 gap-2">
            {FREQUENCIES.map((fr) => (
              <button
                type="button"
                key={fr.id}
                onClick={() => set({ frequency: fr.id })}
                className={cx("rounded-lg border px-3 py-2 text-left text-sm", f.frequency === fr.id ? "border-brand bg-brand-soft text-brand" : "border-line text-ink-2")}
              >
                <b className="block">{fr.label}</b>
                <span className="text-xs opacity-80">{fr.hint}</span>
              </button>
            ))}
          </div>
        </Field>
        {f.frequency === "weekly" && (
          <Field label="Em qual dia da semana?">
            <select value={f.weekday} onChange={(e) => set({ weekday: e.target.value })} className={inputCls}>
              {WEEKDAYS.map((w, i) => (
                <option key={w} value={i}>
                  {w}
                </option>
              ))}
            </select>
          </Field>
        )}
        {f.frequency === "monthly" && (
          <Field label="A partir de qual dia do mês?">
            <input type="number" min={1} max={31} value={f.month_day} onChange={(e) => set({ month_day: e.target.value })} className={inputCls} />
          </Field>
        )}
        <div className="grid grid-cols-2 gap-x-4">
          <Field label="Setor">
            <div className="rounded-lg border border-line px-1 py-0.5">
              <SectorPicker value={f.sector_id} onChange={(v) => set({ sector_id: v })} />
            </div>
          </Field>
          <Field label="Responsável">
            <div className="rounded-lg border border-line px-1 py-0.5">
              <MemberPicker value={f.assignee_id} onChange={(v) => set({ assignee_id: v })} withName size={22} />
            </div>
          </Field>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={!valid}>
            Criar rotina
          </Button>
        </div>
      </form>
    </Modal>
  );
}
