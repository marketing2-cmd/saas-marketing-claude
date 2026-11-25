"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Plus, MessageSquare, CheckSquare, ArrowRightLeft } from "lucide-react";
import { useSpace } from "./store";
import { MemberPicker, StatusPill, DueDate, Avatar, cx } from "./ui";
import { STATUSES, priorityOf, isOverdue } from "@/lib/space/model";

const sortTasks = (a, b) => (a.position ?? 0) - (b.position ?? 0);

// ---------------------------------------------------------------------------
// Lista agrupada por status (inspirada no monday: grupos coloridos + células de status)
export function TaskList({ tasks, onOpen, newTaskDefaults, showSector = false }) {
  const { data, actions } = useSpace();
  const [collapsed, setCollapsed] = useState({ done: true });

  return (
    <div className="space-y-6">
      {STATUSES.map((st) => {
        const group = tasks.filter((t) => t.status === st.id).sort(sortTasks);
        const isCollapsed = collapsed[st.id];
        return (
          <section key={st.id}>
            <button
              onClick={() => setCollapsed((c) => ({ ...c, [st.id]: !c[st.id] }))}
              className="mb-2 flex items-center gap-1.5 text-[15px] font-bold"
              style={{ color: st.id === "todo" ? "rgb(var(--ink-2))" : st.color }}
            >
              {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
              {st.label}
              <span className="ml-1 text-xs font-medium text-muted">{group.length} {group.length === 1 ? "tarefa" : "tarefas"}</span>
            </button>
            {!isCollapsed && (
              <div className="overflow-x-auto rounded-lg border border-line bg-surface" style={{ borderLeft: `4px solid ${st.color}` }}>
                <table className="w-full min-w-[640px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-line text-xs text-muted">
                      <th className="px-3 py-2 text-left font-medium">Tarefa</th>
                      <th className="w-[110px] border-l border-line px-2 py-2 font-medium">Responsável</th>
                      <th className="w-[140px] border-l border-line px-0 py-2 font-medium">Status</th>
                      <th className="w-[120px] border-l border-line px-0 py-2 font-medium">Prioridade</th>
                      <th className="w-[110px] border-l border-line px-2 py-2 font-medium">Prazo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.map((t) => (
                      <TaskRow key={t.id} task={t} onOpen={onOpen} showSector={showSector} />
                    ))}
                    <tr>
                      <td colSpan={5}>
                        <QuickAdd onAdd={(title) => actions.createTask({ ...newTaskDefaults, title, status: st.id })} />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function TaskRow({ task, onOpen, showSector }) {
  const { data, actions } = useSpace();
  const set = (p) => actions.updateTask(task.id, p);
  const nComments = data.comments.filter((c) => c.task_id === task.id).length;
  const checklist = task.checklist || [];
  const sector = data.sectors.find((s) => s.id === task.sector_id);
  return (
    <tr className="group border-b border-line hover:bg-hover/50">
      <td className="cursor-pointer px-3 py-2" onClick={() => onOpen(task.id)}>
        <div className="flex items-center gap-2">
          <span className={cx("truncate text-ink", task.status === "done" && "text-muted line-through")}>{task.title || "Sem título"}</span>
          {task.requested_by_sector_id && <ArrowRightLeft size={13} className="shrink-0 text-brand" title="Pedido de outro setor" />}
          {checklist.length > 0 && (
            <span className="inline-flex shrink-0 items-center gap-0.5 text-xs text-muted">
              <CheckSquare size={12} /> {checklist.filter((c) => c.done).length}/{checklist.length}
            </span>
          )}
          {nComments > 0 && (
            <span className="inline-flex shrink-0 items-center gap-0.5 text-xs text-muted">
              <MessageSquare size={12} /> {nComments}
            </span>
          )}
          {showSector && sector && <span className="ml-auto shrink-0 rounded px-1.5 text-[11px] font-semibold" style={{ color: sector.color, background: sector.color + "14" }}>{sector.name}</span>}
        </div>
      </td>
      <td className="border-l border-line px-2 text-center">
        <div className="flex justify-center">
          <MemberPicker value={task.assignee_id} onChange={(v) => set({ assignee_id: v })} />
        </div>
      </td>
      <td className="h-[38px] border-l border-line p-0">
        <StatusPill block value={task.status} onChange={(v) => set({ status: v })} />
      </td>
      <td className="h-[38px] border-l border-line p-0">
        <StatusPill block kind="priority" value={task.priority} onChange={(v) => set({ priority: v })} />
      </td>
      <td className="border-l border-line px-2 text-center">
        <DueDate value={task.due_date} onChange={(v) => set({ due_date: v })} done={task.status === "done"} />
      </td>
    </tr>
  );
}

function QuickAdd({ onAdd, compact }) {
  const [v, setV] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!v.trim()) return;
        onAdd(v.trim());
        setV("");
      }}
      className={cx("flex items-center gap-2 text-muted", compact ? "px-2 py-1.5" : "px-3 py-2")}
    >
      <Plus size={15} />
      <input value={v} onChange={(e) => setV(e.target.value)} placeholder="Adicionar tarefa" className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted" />
    </form>
  );
}

// ---------------------------------------------------------------------------
// Quadro (kanban, inspirado no ClickUp) com arrastar-e-soltar entre colunas
export function TaskBoard({ tasks, onOpen, newTaskDefaults }) {
  const { actions } = useSpace();
  const [dragId, setDragId] = useState(null);
  const [over, setOver] = useState(null);

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {STATUSES.map((st) => {
        const col = tasks.filter((t) => t.status === st.id).sort(sortTasks);
        return (
          <div
            key={st.id}
            onDragOver={(e) => (e.preventDefault(), setOver(st.id))}
            onDragLeave={() => setOver((o) => (o === st.id ? null : o))}
            onDrop={(e) => {
              e.preventDefault();
              setOver(null);
              const t = tasks.find((x) => x.id === dragId);
              if (t && t.status !== st.id) actions.updateTask(t.id, { status: st.id, position: Date.now() });
              setDragId(null);
            }}
            className={cx("flex w-[280px] shrink-0 flex-col rounded-xl p-2 transition", over === st.id ? "bg-brand-soft" : "bg-hover/70")}
          >
            <div className="mb-2 flex items-center gap-2 px-1.5 pt-1">
              <span className="rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white" style={{ background: st.color }}>
                {st.label}
              </span>
              <span className="text-xs font-semibold text-muted">{col.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {col.map((t) => (
                <BoardCard key={t.id} task={t} onOpen={onOpen} onDragStart={() => setDragId(t.id)} dragging={dragId === t.id} />
              ))}
            </div>
            <QuickAdd compact onAdd={(title) => actions.createTask({ ...newTaskDefaults, title, status: st.id })} />
          </div>
        );
      })}
    </div>
  );
}

function BoardCard({ task, onOpen, onDragStart, dragging }) {
  const { data } = useSpace();
  const assignee = data.members.find((m) => m.id === task.assignee_id);
  const pr = priorityOf(task.priority);
  const checklist = task.checklist || [];
  const overdue = isOverdue(task);
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={() => onOpen(task.id)}
      className={cx("cursor-pointer rounded-lg border border-line bg-surface p-3 shadow-card transition hover:border-line-strong", dragging && "opacity-40")}
    >
      <p className={cx("text-sm font-medium text-ink", task.status === "done" && "text-muted line-through")}>{task.title || "Sem título"}</p>
      <div className="mt-2.5 flex items-center gap-2">
        <Avatar member={assignee} size={22} />
        <DueDate value={task.due_date} done={task.status === "done"} />
        {checklist.length > 0 && (
          <span className="inline-flex items-center gap-0.5 text-xs text-muted">
            <CheckSquare size={12} /> {checklist.filter((c) => c.done).length}/{checklist.length}
          </span>
        )}
        <span className="ml-auto h-2 w-2 rounded-full" style={{ background: pr.color }} title={`Prioridade ${pr.label}`} />
      </div>
      {overdue && <p className="mt-1.5 text-[11px] font-semibold text-red-400">Atrasada</p>}
    </div>
  );
}
