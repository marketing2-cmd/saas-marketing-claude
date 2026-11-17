"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BarChart3, Bell, CalendarDays, ListChecks, KanbanSquare, LayoutGrid, LogOut, Menu, Plus, Settings, ShieldCheck, Sparkles, Users, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { buildTasks } from "@/lib/tasks";
import WorkspaceProvider, { useWorkspace } from "./WorkspaceProvider";
import { NotificationItem } from "./notifications";
import Logo from "./Logo";

const NAV = [
  { href: "/", label: "Visão geral", icon: LayoutGrid },
  { href: "/tarefas", label: "Minhas tarefas", icon: ListChecks },
  { href: "/calendario", label: "Calendário", icon: CalendarDays },
  { href: "/quadro", label: "Quadro de tarefas", icon: KanbanSquare },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
];

export default function AppShell({ user, workspace, demo = null, children }) {
  return (
    <WorkspaceProvider user={user} workspace={workspace} demo={demo}>
      <Shell>{children}</Shell>
    </WorkspaceProvider>
  );
}

function Shell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { workspace, user, openEditor, href, demo, posts, deadlines, notifications, unreadCount, markRead, openNotification } = useWorkspace();
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef(null);
  useEffect(() => {
    if (!bellOpen) return;
    const close = (e) => !bellRef.current?.contains(e.target) && setBellOpen(false);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [bellOpen]);
  const myTasks = buildTasks(posts, deadlines).filter((t) => t.assignee === user.id && (t.status === "draft" || t.status === "changes_requested") && !t.blockedBy).length;
  const [open, setOpen] = useState(false);
  // Navegação otimista: o item clicado acende na hora e uma barra no topo
  // indica o carregamento até a nova página chegar
  const [pendingPath, setPendingPath] = useState(null);
  useEffect(() => setPendingPath(null), [pathname]);
  useEffect(() => {
    if (!pendingPath) return;
    const t = setTimeout(() => setPendingPath(null), 8000); // segurança se a navegação não ocorrer
    return () => clearTimeout(t);
  }, [pendingPath]);

  function go(path) {
    setOpen(false);
    if (path !== pathname) setPendingPath(path);
  }

  async function logout() {
    if (demo) return router.push("/signup");
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const isActive = (path) => {
    const full = href(path);
    const current = pendingPath || pathname;
    return path === "/" ? current === full : current.startsWith(full);
  };
  const pendingReview = posts.filter((p) => p.status === "in_review").length;
  const initials = (user.email || "?").slice(0, 2).toUpperCase();

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-6 pt-6"><Logo /></div>

      <div className="mx-4 mb-5 flex items-center gap-3 rounded-2xl border border-line bg-paper p-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy text-sm font-bold text-white">
          {workspace.name.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{workspace.name}</div>
          <div className="text-[11px] text-ink-mute">{demo ? "Demonstração" : "Plano gratuito"}</div>
        </div>
      </div>

      <div className="px-4">
        <button onClick={() => { setOpen(false); openEditor(); }} className="btn-primary w-full">
          <Plus size={16} strokeWidth={2.5} /> Novo post
        </button>
      </div>

      <div className="mt-6 px-6 text-[11px] font-semibold uppercase tracking-wider text-ink-mute">Menu</div>
      <nav className="mt-2 space-y-1 px-3">
        {NAV.map(({ href: path, label, icon: Icon }) => {
          const active = isActive(path);
          return (
            <Link
              key={path}
              href={href(path)}
              onClick={() => go(href(path))}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active ? "bg-brand-soft text-brand" : "text-ink-soft hover:bg-paper hover:text-ink"
              }`}
            >
              <Icon size={18} strokeWidth={active ? 2.3 : 2} />
              <span className="flex-1">{label}</span>
              {path === "/quadro" && pendingReview > 0 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">{pendingReview}</span>
              )}
              {path === "/tarefas" && myTasks > 0 && (
                <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-bold text-brand">{myTasks}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 px-6 text-[11px] font-semibold uppercase tracking-wider text-ink-mute">Conta</div>
      <nav className="mt-2 space-y-1 px-3">
        <Link
          href={href("/configuracoes")}
          onClick={() => go(href("/configuracoes"))}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
            isActive("/configuracoes") ? "bg-brand-soft text-brand" : "text-ink-soft hover:bg-paper hover:text-ink"
          }`}
        >
          <Settings size={18} /> Configurações
        </Link>
        {user.isAdmin && (
          <Link
            href="/admin"
            onClick={() => go("/admin")}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              (pendingPath || pathname).startsWith("/admin") ? "bg-brand-soft text-brand" : "text-ink-soft hover:bg-paper hover:text-ink"
            }`}
          >
            <ShieldCheck size={18} />
            <span className="flex-1">Aprovar cadastros</span>
            {user.pendingSignups > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">{user.pendingSignups}</span>
            )}
          </Link>
        )}
      </nav>

      <div className="mt-auto p-4">
        <div className="overflow-hidden rounded-2xl bg-navy p-4 text-white">
          <Sparkles size={18} className="text-[#B9A6FF]" />
          <div className="mt-2 text-sm font-semibold">Publicação automática</div>
          <p className="mt-1 text-xs text-white/60">Conecte o Instagram dos clientes e publique assim que eles aprovarem.</p>
          <Link href={href("/clientes")} onClick={() => setOpen(false)} className="mt-3 inline-block rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20">
            Conectar contas
          </Link>
        </div>
        <button onClick={logout} className="mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-ink-soft hover:bg-paper">
          <LogOut size={18} /> {demo ? "Sair da demonstração" : "Sair"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:pl-[264px] print:pl-0">
      {pendingPath && (
        <div className="fixed inset-x-0 top-0 z-[70] h-[3px] overflow-hidden bg-brand-soft print:hidden" role="progressbar" aria-label="Carregando página">
          <div className="h-full w-1/3 animate-[navbar_1s_ease-in-out_infinite] rounded-full bg-brand" />
        </div>
      )}
      {demo && (
        <div className="sticky top-0 z-40 flex flex-wrap items-center justify-center print:hidden gap-x-3 gap-y-1 bg-navy px-4 py-2 text-center text-xs text-white lg:-ml-[264px]">
          <span><b>Modo demonstração</b> — os dados são fictícios e nada é salvo.</span>
          <Link href="/signup" className="rounded-full bg-brand px-3 py-1 font-semibold hover:bg-brand-dark">Criar minha conta grátis</Link>
        </div>
      )}

      <aside className={`fixed bottom-0 left-0 hidden w-[264px] print:!hidden overflow-y-auto border-r border-line bg-white lg:block ${demo ? "top-[36px]" : "top-0"}`}>{sidebar}</aside>

      <header className={`sticky z-30 flex print:hidden items-center justify-between gap-3 border-b border-line bg-white/85 px-4 py-3 backdrop-blur lg:px-8 ${demo ? "top-[52px] sm:top-[36px]" : "top-0"}`}>
        <div className="flex items-center gap-2 lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Abrir menu" className="rounded-xl p-2 hover:bg-paper"><Menu size={20} /></button>
          <Logo />
        </div>
        <div className="hidden text-sm text-ink-soft lg:block">
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
        </div>
        <div className="flex items-center gap-2">
          <div ref={bellRef} className="relative">
            <button onClick={() => setBellOpen((o) => !o)} className={`relative rounded-xl border p-2 transition ${bellOpen ? "border-brand-ring bg-brand-soft text-brand" : "border-line bg-white text-ink-soft hover:text-ink"}`} aria-label={`Notificações${unreadCount ? `, ${unreadCount} não lidas` : ""}`} aria-expanded={bellOpen}>
              <Bell size={18} />
              {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#F2557A] px-1 text-[10px] font-bold text-white">{unreadCount > 99 ? "99+" : unreadCount}</span>}
            </button>
            {bellOpen && (
              <div className="absolute right-0 top-12 z-50 w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-line bg-white shadow-float">
                <div className="flex items-center justify-between border-b border-line px-4 py-3">
                  <span className="font-bold">Notificações</span>
                  {unreadCount > 0 && <button onClick={() => markRead()} className="text-xs font-semibold text-brand hover:underline">Marcar todas como lidas</button>}
                </div>
                <div className="max-h-[60vh] space-y-0.5 overflow-y-auto p-2">
                  {notifications.length === 0 && <p className="p-6 text-center text-sm text-ink-mute">Nenhuma notificação ainda.</p>}
                  {notifications.slice(0, 15).map((n) => (
                    <NotificationItem key={n.id} n={n} compact onOpen={(x) => { setBellOpen(false); if (!openNotification(x) && x.client_id) router.push(href(`/clientes/${x.client_id}`)); }} />
                  ))}
                </div>
                <Link href={`${href("/")}#atividade`} onClick={() => setBellOpen(false)} className="block border-t border-line px-4 py-2.5 text-center text-xs font-semibold text-brand hover:bg-paper">Ver toda a atividade</Link>
              </div>
            )}
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFB48F] to-[#F2557A] text-xs font-bold text-white" title={user.email}>
            {initials}
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-navy/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[280px] overflow-y-auto bg-white shadow-float">
            <button onClick={() => setOpen(false)} aria-label="Fechar menu" className="absolute right-3 top-5 rounded-lg p-2 hover:bg-paper"><X size={18} /></button>
            {sidebar}
          </aside>
        </div>
      )}

      <main className="mx-auto max-w-[1280px] px-4 py-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
