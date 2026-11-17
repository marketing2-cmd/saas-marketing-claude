"use client";

import { AlertTriangle, ArrowRightCircle, CheckCircle2, MessageSquare, Send, UserPlus, XCircle } from "lucide-react";

export const KIND_META = {
  client_comment: { icon: MessageSquare, tone: "bg-amber-100 text-amber-700" },
  client_changes: { icon: AlertTriangle, tone: "bg-rose-100 text-rose-600" },
  client_approved: { icon: CheckCircle2, tone: "bg-emerald-100 text-emerald-700" },
  published: { icon: Send, tone: "bg-sky-100 text-sky-700" },
  publish_failed: { icon: XCircle, tone: "bg-red-100 text-red-700" },
  your_turn: { icon: ArrowRightCircle, tone: "bg-brand-soft text-brand" },
  assigned: { icon: UserPlus, tone: "bg-brand-soft text-brand" },
  team_comment: { icon: MessageSquare, tone: "bg-slate-100 text-slate-600" },
};

export function timeAgo(iso) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "agora";
  if (s < 3600) return `${Math.floor(s / 60)} min atrás`;
  if (s < 86400) return `${Math.floor(s / 3600)}h atrás`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)}d atrás`;
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function NotificationItem({ n, onOpen, compact = false }) {
  const meta = KIND_META[n.kind] || KIND_META.team_comment;
  const Icon = meta.icon;
  return (
    <button
      onClick={() => onOpen(n)}
      className={`flex w-full items-start gap-3 rounded-xl text-left transition hover:bg-paper ${compact ? "px-3 py-2.5" : "border p-3"} ${
        !n.read_at ? (compact ? "bg-brand-soft/40" : "border-brand-ring/60 bg-brand-soft/30") : compact ? "" : "border-line bg-white"
      }`}
    >
      <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${meta.tone}`}><Icon size={15} /></span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className="text-sm font-semibold leading-snug">{n.title}</span>
          {!n.read_at && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" aria-label="Não lida" />}
        </span>
        {n.body && <span className={`mt-0.5 block text-xs text-ink-soft ${compact ? "line-clamp-2" : "line-clamp-3"}`}>{n.body}</span>}
        <span className="mt-1 flex items-center gap-1.5 text-[11px] text-ink-mute">
          {n.is_mention && <span className="rounded bg-brand-soft px-1.5 font-semibold text-brand">@ você</span>}
          {timeAgo(n.created_at)}
        </span>
      </span>
    </button>
  );
}
