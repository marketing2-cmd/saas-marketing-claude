"use client";

import { useEffect, useState } from "react";
import { X, Trash2, Plus, CheckCircle2, Circle, ArrowRightLeft, FileText, Send } from "lucide-react";
import { useSpace } from "./store";
import { Avatar, MemberPicker, SectorPicker, StatusPill, DueDate, Button, Modal, Field, inputCls, Popover, MenuItem, SectorDot, cx } from "./ui";
import { uid } from "@/lib/space/data";
import { formatTime, parseISODate } from "@/lib/space/model";

export function TaskDrawer({ taskId, onClose, onOpenMinute }) {
  const { data, actions } = useSpace();
  const task = data.tasks.find((t) => t.id === taskId);
  const [title, setTitle] = useState(task?.title || "");
  const [desc, setDesc] = useState(task?.description || "");
  const [newItem, setNewItem] = useState("");
  const [comment, setComment] = useState("");

  useEffect(() => {
    setTitle(task?.title || "");
    setDesc(task?.description || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !document.querySelector("[data-modal]") && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!task) return null;
  const set = (patch) => actions.updateTask(task.id, patch);
  const project = data.projects.find((p) => p.id === task.project_id);
  const requester = data.sectors.find((s) => s.id === task.requested_by_sector_id);
  const minute = data.minutes.find((m) => m.id === task.source_minute_id);
  const comments = data.comments.filter((c) => c.task_id === task.id).sort((a, b) => a.created_at.localeCompare(b.created_at));
  const sectorProjects = data.projects.filter((p) => p.sector_id === task.sector_id && !p.archived);
  const checklist = task.checklist || [];
  const doneCount = checklist.filter((c) => c.done).length;
  const isDone = task.status === "done";

  const setChecklist = (list) => set({ checklist: list });

  return (
    <>
      <div className="fixed inset-0 z-30 bg-ink/10" onClick={onClose} />
      <aside className="fixed inset-y-0 right-0 z-40 flex w-full max-w-[560px] flex-col border-l border-line bg-white shadow-pop">
        <div className="flex items-center gap-2 border-b border-line px-5 py-3">
          <Button size="sm" variant={isDone ? "primary" : "outline"} onClick={() => set({ status: isDone ? "todo" : "done" })}>
            <CheckCircle2 size={15} /> {isDone ? "Concluída" : "Marcar como concluída"}
          </Button>
          <div className="flex-1" />
          <button
            onClick={() => {
              if (confirm("Excluir esta tarefa?")) {
                actions.deleteTask(task.id);
                onClose();
              }
            }}
            className="rounded-md p-1.5 text-muted hover:bg-red-50 hover:text-red-600"
            title="Excluir"
          >
            <Trash2 size={17} />
          </button>
          <button onClick={onClose} className="rounded-md p-1.5 text-muted hover:bg-hover" title="Fechar">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {requester && (
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand">
              <ArrowRightLeft size={13} /> Pedido do setor {requester.name}
            </div>
          )}
          <textarea
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => title !== task.title && set({ title })}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), e.currentTarget.blur())}
            rows={1}
            placeholder="Nome da tarefa"
            className={cx("w-full resize-none bg-transparent text-[22px] font-bold leading-snug text-ink outline-none", isDone && "text-muted line-through")}
          />

          <div className="mt-4 grid grid-cols-[120px_1fr] items-center gap-y-2.5 text-sm">
            <span className="text-muted">Responsável</span>
            <MemberPicker value={task.assignee_id} onChange={(v) => set({ assignee_id: v })} withName />
            <span className="text-muted">Prazo</span>
            <div className="flex items-center gap-1">
              <DueDate value={task.due_date} onChange={(v) => set({ due_date: v })} done={isDone} />
              {!task.due_date && <span className="text-[13px] text-muted">Sem prazo</span>}
              {task.due_date && (
                <span className="text-[13px] text-muted">
                  ({parseISODate(task.due_date).toLocaleDateString("pt-BR")})
                </span>
              )}
            </div>
            <span className="text-muted">Status</span>
            <div>
              <StatusPill value={task.status} onChange={(v) => set({ status: v })} />
            </div>
            <span className="text-muted">Prioridade</span>
            <div>
              <StatusPill kind="priority" value={task.priority} onChange={(v) => set({ priority: v })} />
            </div>
            <span className="text-muted">Setor</span>
            <SectorPicker value={task.sector_id} onChange={(v) => set({ sector_id: v, project_id: null })} />
            <span className="text-muted">Projeto</span>
            <Popover
              trigger={
                <button className="flex items-center gap-2 rounded-lg px-1.5 py-1 text-sm hover:bg-hover">
                  {project ? <span className="h-2.5 w-2.5 rounded-sm" style={{ background: project.color }} /> : null}
                  <span className={project ? "text-ink" : "text-muted"}>{project?.name || "Sem projeto"}</span>
                </button>
              }
            >
              {(close) => (
                <>
                  <MenuItem active={!task.project_id} onClick={() => (set({ project_id: null }), close())}>
                    <span className="text-muted">Sem projeto</span>
                  </MenuItem>
                  {sectorProjects.map((p) => (
                    <MenuItem key={p.id} active={p.id === task.project_id} onClick={() => (set({ project_id: p.id }), close())}>
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: p.color }} /> {p.name}
                    </MenuItem>
                  ))}
                  {!sectorProjects.length && <p className="px-2.5 py-1.5 text-xs text-muted">Esse setor ainda não tem projetos.</p>}
                </>
              )}
            </Popover>
            {minute && (
              <>
                <span className="text-muted">Origem</span>
                <button onClick={() => onOpenMinute?.(minute.id)} className="flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-left text-sm text-brand hover:bg-hover">
                  <FileText size={14} /> Ata: {minute.title || "Sem título"}
                </button>
              </>
            )}
          </div>

          <h4 className="mb-1.5 mt-6 text-xs font-semibold uppercase tracking-wide text-muted">Descrição</h4>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            onBlur={() => desc !== task.description && set({ description: desc })}
            placeholder="Do que se trata essa tarefa? Adicione detalhes, links…"
            rows={4}
            className="w-full resize-y rounded-lg border border-transparent px-2 py-1.5 text-sm text-ink outline-none hover:border-line focus:border-brand"
          />

          <h4 className="mb-1.5 mt-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
            Checklist {checklist.length > 0 && <span className="normal-case tracking-normal">{doneCount}/{checklist.length}</span>}
          </h4>
          {checklist.length > 0 && (
            <div className="mb-2 h-1 overflow-hidden rounded-full bg-hover">
              <div className="h-full bg-[#00A86B] transition-all" style={{ width: `${(doneCount / checklist.length) * 100}%` }} />
            </div>
          )}
          <div className="space-y-0.5">
            {checklist.map((item) => (
              <div key={item.id} className="group flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-hover">
                <button onClick={() => setChecklist(checklist.map((c) => (c.id === item.id ? { ...c, done: !c.done } : c)))}>
                  {item.done ? <CheckCircle2 size={18} className="text-[#00A86B]" /> : <Circle size={18} className="text-muted" />}
                </button>
                <span className={cx("flex-1 text-sm", item.done && "text-muted line-through")}>{item.text}</span>
                <button onClick={() => setChecklist(checklist.filter((c) => c.id !== item.id))} className="text-muted opacity-0 group-hover:opacity-100">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newItem.trim()) return;
              setChecklist([...checklist, { id: uid(), text: newItem.trim(), done: false }]);
              setNewItem("");
            }}
            className="mt-1 flex items-center gap-2 px-1.5"
          >
            <Plus size={16} className="text-muted" />
            <input value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="Adicionar item" className="flex-1 bg-transparent py-1 text-sm outline-none" />
          </form>

          <h4 className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-muted">Comentários</h4>
          <div className="space-y-3">
            {comments.map((c) => {
              const author = data.members.find((m) => m.id === c.author_id);
              return (
                <div key={c.id} className="flex gap-2.5">
                  <Avatar member={author} size={28} />
                  <div className="flex-1">
                    <div className="text-[13px]">
                      <span className="font-semibold text-ink">{author?.name || "Alguém"}</span>{" "}
                      <span className="text-muted">
                        {new Date(c.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} · {formatTime(c.created_at)}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-ink-2">{c.body}</p>
                  </div>
                </div>
              );
            })}
            {!comments.length && <p className="text-sm text-muted">Nenhum comentário ainda.</p>}
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!comment.trim()) return;
            actions.addComment(task.id, comment.trim());
            setComment("");
          }}
          className="flex items-center gap-2 border-t border-line px-5 py-3"
        >
          <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Escreva um comentário…" className={inputCls} />
          <Button type="submit" disabled={!comment.trim()}>
            <Send size={15} />
          </Button>
        </form>
      </aside>
    </>
  );
}

// Modal para criar tarefa ou "pedir a outro setor".
export function NewTaskModal({ onClose, onCreated, defaults = {}, request = false }) {
  const { data, me, actions } = useSpace();
  const mySector = data.members.find((m) => m.id === me?.id)?.sector_id || null;
  const [f, setF] = useState({
    title: "",
    description: "",
    sector_id: request ? null : mySector,
    project_id: null,
    assignee_id: request ? null : me?.id,
    due_date: null,
    priority: "medium",
    ...defaults,
  });
  const [from, setFrom] = useState(mySector);
  const set = (p) => setF((x) => ({ ...x, ...p }));
  const projects = data.projects.filter((p) => p.sector_id === f.sector_id && !p.archived);
  const valid = f.title.trim() && f.sector_id && (!request || from);

  async function submit(e) {
    e.preventDefault();
    if (!valid) return;
    const t = await actions.createTask({ ...f, title: f.title.trim(), requested_by_sector_id: request ? from : null });
    onCreated?.(t);
    onClose();
  }

  return (
    <Modal title={request ? "Pedir a outro setor" : "Nova tarefa"} onClose={onClose} width={520}>
      <form onSubmit={submit} data-modal>
        {request && (
          <p className="mb-4 rounded-lg bg-brand-soft px-3 py-2 text-[13px] text-brand">
            O pedido aparece na tela inicial de quem é do setor escolhido. Vocês acompanham o andamento por aqui, sem perder nada no WhatsApp ou e-mail.
          </p>
        )}
        <Field label={request ? "O que você precisa?" : "Nome da tarefa"}>
          <input autoFocus value={f.title} onChange={(e) => set({ title: e.target.value })} className={inputCls} placeholder={request ? "Ex.: Arte para o post de lançamento" : "Ex.: Enviar relatório semanal"} />
        </Field>
        <div className="grid grid-cols-2 gap-x-4">
          {request && (
            <Field label="Seu setor (quem pede)">
              <div className="rounded-lg border border-line px-1 py-0.5">
                <SectorPicker value={from} onChange={setFrom} />
              </div>
            </Field>
          )}
          <Field label={request ? "Setor que vai fazer" : "Setor"}>
            <div className="rounded-lg border border-line px-1 py-0.5">
              <SectorPicker value={f.sector_id} onChange={(v) => set({ sector_id: v, project_id: null })} />
            </div>
          </Field>
          {!request && (
            <Field label="Projeto (opcional)">
              <select value={f.project_id || ""} onChange={(e) => set({ project_id: e.target.value || null })} className={inputCls}>
                <option value="">Sem projeto</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {!request && (
            <Field label="Responsável">
              <div className="rounded-lg border border-line px-1 py-0.5">
                <MemberPicker value={f.assignee_id} onChange={(v) => set({ assignee_id: v })} withName size={22} />
              </div>
            </Field>
          )}
          <Field label="Prazo">
            <input type="date" value={f.due_date || ""} onChange={(e) => set({ due_date: e.target.value || null })} className={inputCls} />
          </Field>
          <Field label="Prioridade">
            <select value={f.priority} onChange={(e) => set({ priority: e.target.value })} className={inputCls}>
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
          </Field>
        </div>
        <Field label="Detalhes (opcional)">
          <textarea value={f.description} onChange={(e) => set({ description: e.target.value })} rows={3} className={inputCls} placeholder="Contexto, links, referências…" />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={!valid}>
            {request ? "Enviar pedido" : "Criar tarefa"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function SectorTag({ sectorId }) {
  const { data } = useSpace();
  const s = data.sectors.find((x) => x.id === sectorId);
  if (!s) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-2">
      <SectorDot sector={s} size={7} /> {s.name}
    </span>
  );
}
