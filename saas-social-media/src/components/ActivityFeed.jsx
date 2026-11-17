"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { useWorkspace } from "./WorkspaceProvider";
import { NotificationItem } from "./notifications";

export default function ActivityFeed() {
  const router = useRouter();
  const { notifications, markRead, openNotification, href } = useWorkspace();
  const [tab, setTab] = useState("all");
  const [limit, setLimit] = useState(8);
  const mentions = notifications.filter((n) => n.is_mention);
  const unread = notifications.filter((n) => !n.read_at);
  const list = tab === "mentions" ? mentions : tab === "unread" ? unread : notifications;

  return (
    <section id="atividade" className="card scroll-mt-24 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-brand" />
          <div>
            <h2 className="font-bold">Atividade recente</h2>
            <p className="text-xs text-ink-mute">O que o cliente disse, aprovou e o que foi publicado.</p>
          </div>
        </div>
        {unread.length > 0 && (
          <button onClick={() => markRead()} className="btn-ghost px-3 py-1.5 text-xs"><CheckCheck size={14} /> Marcar todas como lidas</button>
        )}
      </div>
      <div className="mt-4 grid grid-cols-3 rounded-xl bg-paper p-1 text-sm">
        {[["all", "Tudo", notifications.length], ["mentions", "Menções", mentions.length], ["unread", "Não lidas", unread.length]].map(([k, l, n]) => (
          <button key={k} onClick={() => { setTab(k); setLimit(8); }} className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 font-semibold transition ${tab === k ? "bg-white text-ink shadow-sm" : "text-ink-soft hover:text-ink"}`}>
            {l}
            {n > 0 && <span className={`rounded-full px-1.5 text-[11px] ${k === "unread" ? "bg-brand text-white" : "bg-line text-ink-soft"}`}>{n}</span>}
          </button>
        ))}
      </div>
      <div className="mt-3 space-y-2">
        {list.length === 0 && <p className="py-8 text-center text-sm text-ink-mute">{tab === "unread" ? "Tudo lido ✨" : tab === "mentions" ? "Nenhuma menção a você." : "Nenhuma atividade ainda."}</p>}
        {list.slice(0, limit).map((n) => (
          <NotificationItem key={n.id} n={n} onOpen={(x) => { if (!openNotification(x) && x.client_id) router.push(href(`/clientes/${x.client_id}`)); }} />
        ))}
      </div>
      {list.length > limit && (
        <button onClick={() => setLimit((l) => l + 10)} className="mt-3 w-full rounded-xl py-2 text-xs font-semibold text-brand hover:bg-paper">Ver mais</button>
      )}
    </section>
  );
}
