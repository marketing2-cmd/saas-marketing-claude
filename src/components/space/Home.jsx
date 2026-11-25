"use client";

import { useEffect, useState } from "react";
import { Plus, ArrowRightLeft, FileText, Sun, X, CheckCircle2, Circle, Inbox, ListChecks } from "lucide-react";
import { useSpace } from "./store";
import { Button, Avatar, DueDate, StatusPill, cx } from "./ui";
import { RoutineItem } from "./Routines";
import { SectorTag } from "./TaskDrawer";
import { TaskList } from "./TaskViews";
import { daysFromToday, formatLongDate, toISODate, routineDueToday, periodKey, isOverdue } from "@/lib/space/model";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

function Card({ title, icon: Icon, count, action, children, className }) {
  return (
    <section className={cx("rounded-2xl border border-line bg-surface p-4", className)}>
      <header className="mb-2 flex items-center gap-2 px-1">
        {Icon && <Icon size={16} className="text-muted" />}
        <h2 className="text-[15px] font-bold text-ink">{title}</h2>
        {count != null && <span className="rounded-full bg-hover px-2 text-xs font-semibold text-ink-2">{count}</span>}
        <div className="flex-1" />
        {action}
      </header>
      {children}
    </section>
  );
}

function MiniTask({ task, onOpen, showRequester }) {
  const { data, actions } = useSpace();
  const done = task.status === "done";
  const project = data.projects.find((p) => p.id === task.project_id);
  const assignee = data.members.find((m) => m.id === task.assignee_id);
  return (
    <div className="group flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 hover:bg-hover">
      <button onClick={() => actions.updateTask(task.id, { status: done ? "todo" : "done" })} title={done ? "Reabrir" : "Concluir"}>
        {done ? <CheckCircle2 size={19} className="text-[#00A86B]" /> : <Circle size={19} className="text-faint hover:text-[#00A86B]" />}
      </button>
      <button onClick={() => onOpen(task.id)} className="min-w-0 flex-1 text-left">
        <p className={cx("truncate text-sm text-ink", done && "text-muted line-through")}>{task.title || "Sem título"}</p>
        <p className="truncate text-xs text-muted">
          {showRequester ? (
            <>
              de <SectorTag sectorId={task.requested_by_sector_id} />
            </>
          ) : (
            project?.name || data.sectors.find((s) => s.id === task.sector_id)?.name || ""
          )}
        </p>
      </button>
      {showRequester && <Avatar member={assignee} size={22} />}
      <DueDate value={task.due_date} done={done} />
    </div>
  );
}

export function HomePage({ onOpenTask, onNewTask, onRequest, onNewMinute, navigate }) {
  const { data, me } = useSpace();
  const meMember = data.members.find((m) => m.id === me?.id);
  const mySector = meMember?.sector_id;
  const [showWelcome, setShowWelcome] = useState(false);
  useEffect(() => {
    try {
      setShowWelcome(localStorage.getItem("space-mais-welcome-dismissed") !== "1");
    } catch {}
  }, []);

  const mine = data.tasks.filter((t) => t.assignee_id === me?.id && (t.status !== "done" || (t.completed_at && t.completed_at.slice(0, 10) === toISODate())));
  const overdue = mine.filter(isOverdue);
  const today = mine.filter((t) => t.due_date && daysFromToday(t.due_date) === 0);
  const upcoming = mine.filter((t) => t.due_date && daysFromToday(t.due_date) > 0).sort((a, b) => a.due_date.localeCompare(b.due_date));
  const noDate = mine.filter((t) => !t.due_date);
  const doneToday = mine.filter((t) => t.status === "done" && !(t.due_date && daysFromToday(t.due_date) === 0));

  const myRoutines = data.routines.filter((r) => r.assignee_id === me?.id && routineDueToday(r));
  const routinesDone = myRoutines.filter((r) => data.checks.some((c) => c.id === `${r.id}:${periodKey(r)}`)).length;

  const requestsIn = data.tasks
    .filter((t) => t.requested_by_sector_id && t.sector_id === mySector && t.requested_by_sector_id !== mySector && t.status !== "done")
    .sort((a, b) => (a.due_date || "9999").localeCompare(b.due_date || "9999"));
  const requestsOut = data.tasks
    .filter((t) => t.requested_by_sector_id === mySector && t.sector_id !== mySector)
    .sort((a, b) => (a.status === "done") - (b.status === "done") || (b.created_at || "").localeCompare(a.created_at || ""))
    .slice(0, 6);

  const firstName = (meMember?.name || "").split(" ")[0];
  const pendingCount = overdue.length + today.filter((t) => t.status !== "done").length + (myRoutines.length - routinesDone);

  const groups = [
    { id: "overdue", label: "Atrasadas", items: overdue, tone: "text-red-400" },
    { id: "today", label: "Hoje", items: today, tone: "text-amber-400" },
    { id: "upcoming", label: "Próximos dias", items: upcoming.slice(0, 8), tone: "text-ink-2" },
    { id: "nodate", label: "Sem prazo", items: noDate, tone: "text-ink-2" },
    { id: "done", label: "Concluídas hoje", items: doneToday, tone: "text-emerald-400" },
  ].filter((g) => g.items.length);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div className="flex-1">
          <p className="text-sm text-muted">{formatLongDate(toISODate())}</p>
          <h1 className="text-[28px] font-bold leading-tight text-ink">
            {greeting()}
            {firstName ? `, ${firstName}` : ""}!
          </h1>
          <p className="mt-0.5 text-sm text-ink-2">
            {pendingCount > 0 ? `Você tem ${pendingCount} ${pendingCount === 1 ? "coisa" : "coisas"} para hoje.` : "Tudo em dia por hoje. 🎉"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onNewTask}>
            <Plus size={16} /> Nova tarefa
          </Button>
          <Button variant="outline" onClick={onRequest}>
            <ArrowRightLeft size={15} /> Pedir a outro setor
          </Button>
          <Button variant="outline" onClick={onNewMinute}>
            <FileText size={15} /> Nova ata
          </Button>
        </div>
      </div>

      {showWelcome && (
        <div className="relative mb-6 rounded-2xl bg-gradient-to-r from-brand to-[#ff9a3c] p-5 text-white">
          <button
            onClick={() => {
              setShowWelcome(false);
              try {
                localStorage.setItem("space-mais-welcome-dismissed", "1");
              } catch {}
            }}
            className="absolute right-3 top-3 rounded-md p-1 text-white/80 hover:bg-surface/10"
            title="Fechar"
          >
            <X size={18} />
          </button>
          <p className="text-lg font-bold">Bem-vindo(a) ao SpaceMais 👋</p>
          <p className="mb-3 text-sm text-white/85">Tudo da Contattos+ num lugar só. Para começar, é só isso:</p>
          <div className="grid gap-3 text-sm md:grid-cols-4">
            {[
              ["1", "Comece o dia aqui", "Suas tarefas e rotinas de hoje aparecem nesta tela."],
              ["2", "Marque o que fez", "Clique no círculo para concluir uma tarefa ou rotina."],
              ["3", "Peça a outro setor", "Use “Pedir a outro setor” em vez de mandar no WhatsApp."],
              ["4", "Registre reuniões", "Em Atas, os encaminhamentos viram tarefas sozinhos."],
            ].map(([n, t, d]) => (
              <div key={n} className="rounded-xl bg-white/10 p-3">
                <p className="font-semibold">
                  <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-surface text-xs font-bold text-brand">{n}</span>
                  {t}
                </p>
                <p className="mt-1 text-[13px] text-white/80">{d}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <Card title="Minhas tarefas" icon={ListChecks} count={mine.filter((t) => t.status !== "done").length} action={<button onClick={() => navigate({ view: "mytasks" })} className="text-xs font-semibold text-brand hover:underline">Ver todas</button>}>
          {groups.length === 0 && <p className="px-1.5 py-6 text-center text-sm text-muted">Nenhuma tarefa com você. Crie uma em “Nova tarefa”.</p>}
          {groups.map((g) => (
            <div key={g.id} className="mb-2">
              <p className={cx("px-1.5 pb-0.5 pt-2 text-xs font-semibold uppercase tracking-wide", g.tone)}>
                {g.label} · {g.items.length}
              </p>
              {g.items.map((t) => (
                <MiniTask key={t.id} task={t} onOpen={onOpenTask} />
              ))}
            </div>
          ))}
        </Card>

        <div className="space-y-5">
          <Card
            title="Rotina de hoje"
            icon={Sun}
            action={myRoutines.length > 0 && <span className="text-xs font-semibold text-muted">{routinesDone}/{myRoutines.length}</span>}
          >
            {myRoutines.length === 0 ? (
              <p className="px-1.5 py-3 text-sm text-muted">
                Sem rotinas para hoje.{" "}
                <button onClick={() => navigate({ view: "routines" })} className="font-semibold text-brand hover:underline">
                  Criar rotina
                </button>
              </p>
            ) : (
              myRoutines.map((r) => <RoutineItem key={r.id} routine={r} />)
            )}
          </Card>

          <Card title="Pedidos para o meu setor" icon={Inbox} count={requestsIn.length}>
            {!mySector && <p className="px-1.5 py-3 text-sm text-muted">Escolha seu setor no seu perfil (canto inferior esquerdo) para ver os pedidos.</p>}
            {mySector && requestsIn.length === 0 && <p className="px-1.5 py-3 text-sm text-muted">Nenhum pedido em aberto. 👌</p>}
            {requestsIn.map((t) => (
              <MiniTask key={t.id} task={t} onOpen={onOpenTask} showRequester />
            ))}
          </Card>

          {requestsOut.length > 0 && (
            <Card title="Pedidos que fizemos" icon={ArrowRightLeft}>
              {requestsOut.map((t) => (
                <button key={t.id} onClick={() => onOpenTask(t.id)} className="flex w-full items-center gap-2 rounded-lg px-1.5 py-1.5 text-left hover:bg-hover">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-ink">{t.title}</p>
                    <p className="text-xs text-muted">
                      para <SectorTag sectorId={t.sector_id} />
                    </p>
                  </div>
                  <StatusPill value={t.status} />
                </button>
              ))}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export function MyTasksPage({ onOpenTask }) {
  const { data, me } = useSpace();
  const tasks = data.tasks.filter((t) => t.assignee_id === me?.id);
  return <TaskList tasks={tasks} onOpen={onOpenTask} newTaskDefaults={{ assignee_id: me?.id, sector_id: data.members.find((m) => m.id === me?.id)?.sector_id || null }} showSector />;
}

