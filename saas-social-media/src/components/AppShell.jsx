"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarDays, KanbanSquare, LayoutDashboard, LogOut, Menu, Plus, Settings, Users, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import WorkspaceProvider, { useWorkspace } from "./WorkspaceProvider";
import Logo from "./Logo";

const NAV = [
  { href: "/", label: "Visão geral", icon: LayoutDashboard },
  { href: "/calendario", label: "Calendário", icon: CalendarDays },
  { href: "/quadro", label: "Quadro", icon: KanbanSquare },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export default function AppShell({ user, workspace, children }) {
  return (
    <WorkspaceProvider user={user} workspace={workspace}>
      <Shell>{children}</Shell>
    </WorkspaceProvider>
  );
}

function Shell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { workspace, user, openEditor } = useWorkspace();
  const [open, setOpen] = useState(false);

  async function logout() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const isActive = (href) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const sidebar = (
    <div className="flex h-full flex-col">
      <Logo className="px-5 py-5" />
      <div className="mx-3 mb-4 rounded-lg bg-paper px-3 py-2">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-mute">Espaço</div>
        <div className="truncate text-sm font-semibold">{workspace.name}</div>
      </div>
      <button onClick={() => { setOpen(false); openEditor(); }} className="btn-primary mx-3 mb-4">
        <Plus size={16} /> Novo post
      </button>
      <nav className="flex-1 space-y-1 px-3">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
              isActive(href) ? "bg-brand-soft text-brand" : "text-ink-soft hover:bg-paper hover:text-ink"
            }`}
          >
            <Icon size={18} /> {label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-line p-3">
        <div className="truncate px-3 pb-2 text-xs text-ink-mute">{user.email}</div>
        <button onClick={logout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-soft hover:bg-paper">
          <LogOut size={18} /> Sair
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line bg-white lg:block">{sidebar}</aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-white px-4 py-3 lg:hidden">
        <Logo />
        <button onClick={() => setOpen(true)} aria-label="Abrir menu" className="rounded-lg p-2 hover:bg-paper">
          <Menu size={20} />
        </button>
      </header>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-xl">
            <button onClick={() => setOpen(false)} aria-label="Fechar menu" className="absolute right-3 top-4 rounded-lg p-2 hover:bg-paper">
              <X size={18} />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
