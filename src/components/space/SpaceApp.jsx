"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Home, MessageCircle, FileText, Repeat, ListChecks, ChevronRight, ChevronDown, Plus, LogOut, Menu, X,
  LayoutList, Kanban, FolderKanban, Inbox, MoreHorizontal, Archive, Trash2, Megaphone, ArrowRightLeft,
} from "lucide-react";
import { SpaceProvider, useSpace } from "./store";
import { Avatar, Button, Modal, Field, inputCls, Tabs, Empty, Popover, MenuItem, SectorDot, cx } from "./ui";
import { TaskList, TaskBoard } from "./TaskViews";
import { TaskDrawer, NewTaskModal } from "./TaskDrawer";
import { HomePage, MyTasksPage } from "./Home";
import { RoutinesPage } from "./Routines";
import { MinutesPage } from "./Minutes";
import { ChatPage } from "./Chat";
import { PALETTE, STATUSES } from "@/lib/space/model";

export default function SpaceApp() {
  return (
    <SpaceProvider>
      <Shell />
    </SpaceProvider>
  );
}

// Rota simples no hash da URL (#/projeto/abc) — sobrevive a F5 e ao botão voltar.
function parseHash() {
  if (typeof window === "undefined") return { view: "home" };
  const [view = "home", id] = window.location.hash.replace(/^#\/?/, "").split("/");
  return { view: view || "home", id: id ? decodeURIComponent(id) : undefined };
}
function useRoute() {
  const [route, setRoute] = useState({ view: "home" });
  useEffect(() => {
    setRoute(parseHash());
    const on = () => setRoute(parseHash());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  const navigate = useCallback((r) => {
    window.location.hash = `/${r.view}${r.id ? "/" + encodeURIComponent(r.id) : ""}`;
  }, []);
  return [route, navigate];
}

function Shell() {
  const { status, error, data, me, toast, demo } = useSpace();
  const [route, navigate] = useRoute();
  const [taskId, setTaskId] = useState(null);
  const [modal, setModal] = useState(null); // 'task' | 'request' | 'project' | 'profile'
  const [modalDefaults, setModalDefaults] = useState({});
  const [mobileNav, setMobileNav] = useState(false);
  const meMember = data.members.find((m) => m.id === me?.id);

  useEffect(() => {
    setMobileNav(false);
    setTaskId(null);
  }, [route.view, route.id]);

  // Primeiro acesso: pede nome e setor.
  useEffect(() => {
    if (status === "ready" && meMember && !meMember.sector_id && !demo) setModal("profile");
  }, [status, meMember, demo]);

  if (status === "loading")
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <Logo className="animate-pulse" />
      </div>
    );
  if (status === "error")
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
        <div className="max-w-md rounded-2xl border border-line bg-white p-6 text-center">
          <Logo />
          <p className="mt-4 font-semibold text-ink">Não foi possível carregar o space+</p>
          <p className="mt-1 text-sm text-muted">{error}</p>
          <p className="mt-3 text-xs text-muted">Se for a primeira vez, confira se o arquivo supabase/space.sql foi executado no Supabase.</p>
        </div>
      </div>
    );

  const openTask = (id) => setTaskId(id);
  const newTask = (defaults = {}) => (setModalDefaults(defaults), setModal("task"));
  const newMinute = () => navigate({ view: "atas", id: "nova" });

  let page;
  let title = "";
  if (route.view === "project") {
    page = <ProjectPage id={route.id} onOpenTask={openTask} navigate={navigate} />;
  } else if (route.view === "sector") {
    page = <SectorPage id={route.id} onOpenTask={openTask} navigate={navigate} onNewProject={() => (setModalDefaults({ sector_id: route.id }), setModal("project"))} />;
  } else if (route.view === "chat") {
    title = "Chat";
    page = <ChatPage />;
  } else if (route.view === "atas") {
    title = "Atas de reunião";
    page = <MinutesNew id={route.id} onOpenTask={openTask} navigate={navigate} />;
  } else if (route.view === "routines") {
    title = "Rotinas";
    page = <RoutinesPage />;
  } else if (route.view === "mytasks") {
    title = "Minhas tarefas";
    page = <MyTasksPage onOpenTask={openTask} />;
  } else {
    page = <HomePage onOpenTask={openTask} onNewTask={() => newTask()} onRequest={() => setModal("request")} onNewMinute={newMinute} navigate={navigate} />;
  }

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar route={route} navigate={navigate} open={mobileNav} onClose={() => setMobileNav(false)} onNewProject={(sectorId) => (setModalDefaults({ sector_id: sectorId }), setModal("project"))} onProfile={() => setModal("profile")} />
      <main className="min-w-0 flex-1">
        <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-white/90 px-4 py-2.5 backdrop-blur md:hidden">
          <button onClick={() => setMobileNav(true)} className="rounded-md p-1 text-ink-2 hover:bg-hover">
            <Menu size={20} />
          </button>
          <Logo small />
        </div>
        {demo && (
          <div className="bg-[#FFF4D6] px-4 py-1.5 text-center text-xs text-[#7A5200]">
            Modo demonstração — os dados ficam só neste navegador. Bom para treinar a equipe.
          </div>
        )}
        <div className="px-4 py-6 md:px-8 md:py-8">
          {title && <h1 className="mx-auto mb-5 max-w-6xl text-2xl font-bold text-ink">{title}</h1>}
          {page}
        </div>
      </main>

      {taskId && <TaskDrawer taskId={taskId} onClose={() => setTaskId(null)} onOpenMinute={(id) => (setTaskId(null), navigate({ view: "atas", id }))} />}
      {modal === "task" && <NewTaskModal defaults={modalDefaults} onClose={() => setModal(null)} />}
      {modal === "request" && <NewTaskModal request onClose={() => setModal(null)} />}
      {modal === "project" && <NewProjectModal defaults={modalDefaults} onClose={() => setModal(null)} onCreated={(p) => navigate({ view: "project", id: p.id })} />}
      {modal === "profile" && <ProfileModal onClose={() => setModal(null)} />}

      {toast && (
        <div className={cx("fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-pop", toast.kind === "error" ? "bg-red-600" : "bg-ink")}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

// "#/atas/nova" cria uma ata e abre; "#/atas/<id>" abre a ata.
function MinutesNew({ id, onOpenTask, navigate }) {
  const { actions } = useSpace();
  const [openId, setOpenId] = useState(id !== "nova" ? id : undefined);
  const creating = useRef(false);
  useEffect(() => {
    if (id === "nova") {
      if (creating.current) return;
      creating.current = true;
      actions.createMinute({}).then((m) => {
        setOpenId(m.id);
        navigate({ view: "atas", id: m.id });
      });
    } else setOpenId(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  return <MinutesPage openId={openId} onOpenTask={onOpenTask} />;
}

export function Logo({ small, className }) {
  return (
    <span className={cx("inline-flex items-center gap-2", className)}>
      <span className={cx("flex items-center justify-center rounded-lg bg-brand font-black text-white", small ? "h-7 w-7 text-base" : "h-8 w-8 text-lg")}>+</span>
      <span className={cx("font-bold tracking-tight text-ink", small ? "text-base" : "text-[17px]")}>
        space<span className="text-brand">mais</span>
      </span>
    </span>
  );
}

// ---------------------------------------------------------------------------
function Sidebar({ route, navigate, open, onClose, onNewProject, onProfile }) {
  const { data, me, actions } = useSpace();
  const meMember = data.members.find((m) => m.id === me?.id);
  const [expanded, setExpanded] = useState({});
  const mySector = meMember?.sector_id;
  useEffect(() => {
    if (mySector) setExpanded((e) => ({ [mySector]: true, ...e }));
  }, [mySector]);
  const activeProject = route.view === "project" && data.projects.find((p) => p.id === route.id);
  useEffect(() => {
    if (activeProject) setExpanded((e) => ({ ...e, [activeProject.sector_id]: true }));
  }, [activeProject]);

  const requestsIn = data.tasks.filter((t) => t.requested_by_sector_id && t.sector_id === mySector && t.requested_by_sector_id !== mySector && t.status !== "done").length;

  const Item = ({ icon: Icon, label, view, badge }) => (
    <button
      onClick={() => navigate({ view })}
      className={cx("flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm", route.view === view ? "bg-brand-soft font-semibold text-brand" : "text-ink-2 hover:bg-hover")}
    >
      <Icon size={17} />
      <span className="flex-1 text-left">{label}</span>
      {badge > 0 && <span className="rounded-full bg-brand px-1.5 text-[11px] font-bold text-white">{badge}</span>}
    </button>
  );

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-ink/30 md:hidden" onClick={onClose} />}
      <nav
        className={cx(
          "fixed inset-y-0 left-0 z-50 flex w-[256px] shrink-0 flex-col border-r border-line bg-white transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-4 pb-3 pt-4">
          <button onClick={() => navigate({ view: "home" })}>
            <Logo />
          </button>
          <button onClick={onClose} className="rounded-md p-1 text-muted hover:bg-hover md:hidden">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2.5">
          <div className="space-y-0.5">
            <Item icon={Home} label="Início" view="home" badge={requestsIn} />
            <Item icon={ListChecks} label="Minhas tarefas" view="mytasks" />
            <Item icon={Repeat} label="Rotinas" view="routines" />
            <Item icon={FileText} label="Atas" view="atas" />
            <Item icon={MessageCircle} label="Chat" view="chat" />
          </div>

          <p className="mb-1 mt-6 px-2.5 text-xs font-semibold uppercase tracking-wide text-muted">Setores</p>
          <div className="space-y-0.5 pb-4">
            {[...data.sectors]
              .sort((a, b) => a.position - b.position)
              .map((s) => {
                const projects = data.projects.filter((p) => p.sector_id === s.id && !p.archived);
                const isOpen = expanded[s.id];
                const active = route.view === "sector" && route.id === s.id;
                return (
                  <div key={s.id}>
                    <div className={cx("group flex items-center rounded-lg", active ? "bg-brand-soft" : "hover:bg-hover")}>
                      <button onClick={() => setExpanded((e) => ({ ...e, [s.id]: !e[s.id] }))} className="p-1.5 pl-2 text-muted">
                        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                      <button onClick={() => navigate({ view: "sector", id: s.id })} className={cx("flex flex-1 items-center gap-2 py-1.5 text-left text-sm", active ? "font-semibold text-brand" : "text-ink")}>
                        <span className="flex h-5 w-5 items-center justify-center rounded-md text-[11px] font-bold text-white" style={{ background: s.color }}>
                          {s.name[0]}
                        </span>
                        <span className="truncate">{s.name}</span>
                        {s.id === mySector && <span className="text-[10px] font-semibold text-muted">(meu)</span>}
                      </button>
                      <button onClick={() => onNewProject(s.id)} className="mr-1 rounded p-1 text-muted opacity-0 hover:bg-white group-hover:opacity-100" title="Novo projeto">
                        <Plus size={14} />
                      </button>
                    </div>
                    {isOpen && (
                      <div className="ml-[22px] border-l border-line pl-2">
                        {projects.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => navigate({ view: "project", id: p.id })}
                            className={cx(
                              "flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left text-[13px]",
                              route.view === "project" && route.id === p.id ? "bg-brand-soft font-semibold text-brand" : "text-ink-2 hover:bg-hover"
                            )}
                          >
                            <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: p.color }} />
                            <span className="truncate">{p.name}</span>
                          </button>
                        ))}
                        <button onClick={() => onNewProject(s.id)} className="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left text-[13px] text-muted hover:bg-hover">
                          <Plus size={13} /> Novo projeto
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        <div className="border-t border-line p-2.5">
          <a href="/marketing-os" className="mb-1 flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] text-ink-2 hover:bg-hover">
            <Megaphone size={15} /> Marketing OS
          </a>
          <div className="flex items-center gap-2 rounded-lg px-1.5 py-1">
            <button onClick={onProfile} className="flex min-w-0 flex-1 items-center gap-2 rounded-lg p-1 text-left hover:bg-hover" title="Editar perfil">
              <Avatar member={meMember} size={30} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-ink">{meMember?.name || me?.email}</span>
                <span className="block truncate text-xs text-muted">{data.sectors.find((s) => s.id === mySector)?.name || "Escolha seu setor"}</span>
              </span>
            </button>
            <button onClick={actions.signOut} className="rounded-md p-1.5 text-muted hover:bg-hover" title="Sair">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}

// ---------------------------------------------------------------------------
function ProjectPage({ id, onOpenTask, navigate }) {
  const { data, me, actions } = useSpace();
  const project = data.projects.find((p) => p.id === id);
  const [view, setView] = useState("list");
  const [onlyMine, setOnlyMine] = useState(false);
  const [name, setName] = useState(project?.name || "");
  useEffect(() => setName(project?.name || ""), [project?.name]);
  useEffect(() => {
    try {
      const v = localStorage.getItem("space-mais-project-view");
      if (v) setView(v);
    } catch {}
  }, []);
  const changeView = (v) => {
    setView(v);
    try {
      localStorage.setItem("space-mais-project-view", v);
    } catch {}
  };

  if (!project) return <Empty icon={FolderKanban} title="Projeto não encontrado" />;
  const sector = data.sectors.find((s) => s.id === project.sector_id);
  let tasks = data.tasks.filter((t) => t.project_id === project.id);
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  if (onlyMine) tasks = tasks.filter((t) => t.assignee_id === me?.id);
  const defaults = { project_id: project.id, sector_id: project.sector_id };

  return (
    <div className="mx-auto max-w-6xl">
      <button onClick={() => navigate({ view: "sector", id: sector?.id })} className="mb-1 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <SectorDot sector={sector} /> {sector?.name}
      </button>
      <div className="flex items-center gap-3">
        <span className="h-4 w-4 shrink-0 rounded" style={{ background: project.color }} />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => name.trim() && name !== project.name && actions.updateProject(project.id, { name: name.trim() })}
          className="min-w-0 flex-1 bg-transparent text-2xl font-bold text-ink outline-none"
        />
        <Popover align="right" trigger={<button className="rounded-md p-1.5 text-muted hover:bg-hover"><MoreHorizontal size={18} /></button>}>
          {(close) => (
            <>
              <div className="flex flex-wrap gap-1.5 p-2">
                {PALETTE.map((c) => (
                  <button key={c} onClick={() => actions.updateProject(project.id, { color: c })} className={cx("h-5 w-5 rounded", project.color === c && "ring-2 ring-offset-1")} style={{ background: c, "--tw-ring-color": c }} />
                ))}
              </div>
              <MenuItem onClick={() => (actions.updateProject(project.id, { archived: true }), close(), navigate({ view: "sector", id: project.sector_id }))}>
                <Archive size={15} /> Arquivar projeto
              </MenuItem>
              <MenuItem
                onClick={() => {
                  close();
                  if (confirm(`Excluir o projeto "${project.name}" e todas as suas tarefas?`)) {
                    actions.deleteProject(project.id);
                    navigate({ view: "sector", id: project.sector_id });
                  }
                }}
              >
                <span className="flex items-center gap-2 text-red-600">
                  <Trash2 size={15} /> Excluir projeto
                </span>
              </MenuItem>
            </>
          )}
        </Popover>
      </div>
      {project.description && <p className="mt-1 text-sm text-ink-2">{project.description}</p>}
      {total > 0 && (
        <div className="mt-3 flex items-center gap-2 text-xs text-muted">
          <div className="flex h-1.5 w-40 overflow-hidden rounded-full bg-hover">
            {STATUSES.map((s) => {
              const n = data.tasks.filter((t) => t.project_id === project.id && t.status === s.id).length;
              return <div key={s.id} style={{ width: `${(n / total) * 100}%`, background: s.color }} />;
            })}
          </div>
          {done} de {total} concluídas
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-end gap-3">
        <div className="flex-1">
          <Tabs
            value={view}
            onChange={changeView}
            tabs={[
              { id: "list", label: "Lista", icon: LayoutList },
              { id: "board", label: "Quadro", icon: Kanban },
            ]}
          />
        </div>
        <label className="mb-2 flex cursor-pointer items-center gap-2 text-sm text-ink-2">
          <input type="checkbox" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} className="accent-brand" /> Só as minhas
        </label>
      </div>
      <div className="mt-5">{view === "board" ? <TaskBoard tasks={tasks} onOpen={onOpenTask} newTaskDefaults={defaults} /> : <TaskList tasks={tasks} onOpen={onOpenTask} newTaskDefaults={defaults} />}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
function SectorPage({ id, onOpenTask, navigate, onNewProject }) {
  const { data } = useSpace();
  const sector = data.sectors.find((s) => s.id === id);
  const [tab, setTab] = useState("projects");
  useEffect(() => setTab("projects"), [id]);
  if (!sector) return <Empty icon={FolderKanban} title="Setor não encontrado" />;

  const projects = data.projects.filter((p) => p.sector_id === id && !p.archived);
  const archived = data.projects.filter((p) => p.sector_id === id && p.archived);
  const sectorTasks = data.tasks.filter((t) => t.sector_id === id);
  const reqIn = sectorTasks.filter((t) => t.requested_by_sector_id && t.requested_by_sector_id !== id);
  const reqOut = data.tasks.filter((t) => t.requested_by_sector_id === id && t.sector_id !== id);
  const people = data.members.filter((m) => m.sector_id === id);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold text-white" style={{ background: sector.color }}>
          {sector.name[0]}
        </span>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-ink">{sector.name}</h1>
          <p className="text-sm text-muted">
            {people.length} {people.length === 1 ? "pessoa" : "pessoas"} · {projects.length} {projects.length === 1 ? "projeto" : "projetos"}
          </p>
        </div>
        <div className="flex -space-x-1.5">
          {people.slice(0, 6).map((p) => (
            <span key={p.id} className="rounded-full ring-2 ring-canvas">
              <Avatar member={p} size={28} />
            </span>
          ))}
        </div>
      </div>
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "projects", label: "Projetos", icon: FolderKanban, count: projects.length },
          { id: "tasks", label: "Tarefas", icon: LayoutList },
          { id: "requests", label: "Pedidos", icon: ArrowRightLeft, count: reqIn.filter((t) => t.status !== "done").length || null },
          { id: "routines", label: "Rotinas", icon: Repeat },
          { id: "minutes", label: "Atas", icon: FileText },
        ]}
      />
      <div className="mt-5">
        {tab === "projects" && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => {
              const ts = data.tasks.filter((t) => t.project_id === p.id);
              const done = ts.filter((t) => t.status === "done").length;
              const pct = ts.length ? Math.round((done / ts.length) * 100) : 0;
              const assignees = [...new Set(ts.map((t) => t.assignee_id).filter(Boolean))].map((aid) => data.members.find((m) => m.id === aid)).filter(Boolean);
              return (
                <button key={p.id} onClick={() => navigate({ view: "project", id: p.id })} className="rounded-xl border border-line bg-white p-4 text-left shadow-card transition hover:border-[#C9CEDA] hover:shadow-pop">
                  <div className="mb-3 h-1.5 w-10 rounded-full" style={{ background: p.color }} />
                  <p className="font-semibold text-ink">{p.name}</p>
                  <p className="mt-0.5 line-clamp-2 min-h-[40px] text-[13px] text-muted">{p.description || "Sem descrição"}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-hover">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: p.color }} />
                    </div>
                    <span className="text-xs font-semibold text-ink-2">{pct}%</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted">
                    <span>
                      {ts.length - done} {ts.length - done === 1 ? "tarefa aberta" : "tarefas abertas"}
                    </span>
                    <span className="flex -space-x-1">
                      {assignees.slice(0, 4).map((a) => (
                        <span key={a.id} className="rounded-full ring-2 ring-white">
                          <Avatar member={a} size={20} />
                        </span>
                      ))}
                    </span>
                  </div>
                </button>
              );
            })}
            <button onClick={onNewProject} className="flex min-h-[150px] flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line text-sm text-muted transition hover:border-brand hover:text-brand">
              <Plus size={20} /> Novo projeto
            </button>
            {archived.length > 0 && <p className="col-span-full text-xs text-muted">{archived.length} projeto(s) arquivado(s).</p>}
          </div>
        )}
        {tab === "tasks" && <TaskList tasks={sectorTasks} onOpen={onOpenTask} newTaskDefaults={{ sector_id: id }} />}
        {tab === "requests" && <RequestsTab reqIn={reqIn} reqOut={reqOut} onOpenTask={onOpenTask} />}
        {tab === "routines" && <RoutinesPage sectorId={id} embedded />}
        {tab === "minutes" && <MinutesPage sectorId={id} onOpenTask={onOpenTask} embedded />}
      </div>
    </div>
  );
}

function RequestsTab({ reqIn, reqOut, onOpenTask }) {
  const { data } = useSpace();
  const Row = ({ t, other }) => {
    const s = data.sectors.find((x) => x.id === other);
    const st = STATUSES.find((x) => x.id === t.status);
    return (
      <button onClick={() => onOpenTask(t.id)} className="flex w-full items-center gap-3 border-b border-line px-4 py-2.5 text-left last:border-0 hover:bg-[#FAFBFC]">
        <span className={cx("flex-1 truncate text-sm", t.status === "done" && "text-muted line-through")}>{t.title}</span>
        <span className="flex items-center gap-1.5 text-xs text-ink-2">
          <SectorDot sector={s} size={7} /> {s?.name}
        </span>
        <span className="w-[110px] rounded-md py-0.5 text-center text-xs font-semibold text-white" style={{ background: st.color }}>
          {st.label}
        </span>
      </button>
    );
  };
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section>
        <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-ink">
          <Inbox size={16} /> Recebidos (outros setores pediram)
        </h3>
        <div className="rounded-xl border border-line bg-white">
          {reqIn.length ? reqIn.map((t) => <Row key={t.id} t={t} other={t.requested_by_sector_id} />) : <p className="p-4 text-sm text-muted">Nenhum pedido recebido.</p>}
        </div>
      </section>
      <section>
        <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-ink">
          <ArrowRightLeft size={16} /> Enviados (pedimos a outros setores)
        </h3>
        <div className="rounded-xl border border-line bg-white">
          {reqOut.length ? reqOut.map((t) => <Row key={t.id} t={t} other={t.sector_id} />) : <p className="p-4 text-sm text-muted">Nenhum pedido enviado.</p>}
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
function NewProjectModal({ defaults, onClose, onCreated }) {
  const { data, actions } = useSpace();
  const [f, setF] = useState({ name: "", description: "", sector_id: defaults.sector_id || data.sectors[0]?.id, color: PALETTE[Math.floor(Math.random() * 5)] });
  const valid = f.name.trim() && f.sector_id;
  return (
    <Modal title="Novo projeto" onClose={onClose}>
      <form
        data-modal
        onSubmit={async (e) => {
          e.preventDefault();
          if (!valid) return;
          const p = await actions.createProject({ ...f, name: f.name.trim() });
          onCreated(p);
          onClose();
        }}
      >
        <Field label="Nome do projeto">
          <input autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={inputCls} placeholder="Ex.: Lançamento linha 2027" />
        </Field>
        <Field label="Descrição (opcional)">
          <textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} rows={2} className={inputCls} />
        </Field>
        <Field label="Setor">
          <select value={f.sector_id} onChange={(e) => setF({ ...f, sector_id: e.target.value })} className={inputCls}>
            {data.sectors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Cor">
          <div className="flex gap-2">
            {PALETTE.map((c) => (
              <button type="button" key={c} onClick={() => setF({ ...f, color: c })} className={cx("h-7 w-7 rounded-lg", f.color === c && "ring-2 ring-offset-2")} style={{ background: c, "--tw-ring-color": c }} />
            ))}
          </div>
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={!valid}>
            Criar projeto
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ProfileModal({ onClose }) {
  const { data, me, actions } = useSpace();
  const meMember = data.members.find((m) => m.id === me?.id);
  const [name, setName] = useState(meMember?.name || "");
  const [sector, setSector] = useState(meMember?.sector_id || "");
  const firstTime = !meMember?.sector_id;
  return (
    <Modal title={firstTime ? "Bem-vindo(a) ao space+! 👋" : "Seu perfil"} onClose={onClose}>
      <form
        data-modal
        onSubmit={(e) => {
          e.preventDefault();
          actions.updateMe({ name: name.trim() || meMember?.name, sector_id: sector || null });
          onClose();
        }}
      >
        {firstTime && <p className="mb-4 text-sm text-ink-2">Só duas informações para começar. Assim seus colegas te encontram e os pedidos do seu setor chegam até você.</p>}
        <Field label="Como você quer ser chamado(a)?">
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Em qual setor você trabalha?">
          <div className="grid grid-cols-2 gap-2">
            {[...data.sectors]
              .sort((a, b) => a.position - b.position)
              .map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => setSector(s.id)}
                  className={cx("flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm", sector === s.id ? "border-brand bg-brand-soft font-semibold text-brand" : "border-line text-ink-2")}
                >
                  <SectorDot sector={s} /> {s.name}
                </button>
              ))}
          </div>
        </Field>
        <div className="flex justify-end">
          <Button type="submit" disabled={!name.trim() || !sector}>
            {firstTime ? "Começar" : "Salvar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
