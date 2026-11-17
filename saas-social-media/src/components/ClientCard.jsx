"use client";

import Link from "next/link";
import { Instagram } from "lucide-react";
import { Avatar, MediaView } from "./PostPreview";
import ClientCover from "./ClientCover";
import { CONTRACT_STATUSES, formatBRL } from "@/lib/clients";

// Card de cliente com banner em degradê pastel
export default function ClientCard({ client, posts, account, href, footer }) {
  const pending = posts.filter((p) => p.status === "in_review").length;
  const thumbs = posts.filter((p) => p.media?.[0] && p.format !== "story").slice(0, 3);
  return (
    <Link href={href} className="card group overflow-hidden transition hover:-translate-y-0.5 hover:shadow-float">
      <ClientCover client={client} className="h-20">
        {pending > 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-amber-700 shadow-sm">
            {pending} em aprovação
          </span>
        )}
      </ClientCover>
      <div className="relative -mt-7 px-4 pb-4">
        <div className="inline-block rounded-full bg-white p-1 shadow-soft"><Avatar client={client} size={46} /></div>
        <div className="mt-1.5 flex items-center gap-2">
          <span className="truncate font-bold">{client.name}</span>
          {client.contract_status && client.contract_status !== "active" && (
            <span className={`chip shrink-0 ${CONTRACT_STATUSES[client.contract_status]?.color}`}>{CONTRACT_STATUSES[client.contract_status]?.label}</span>
          )}
        </div>
        {(client.niche || client.monthly_fee != null) && (
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-soft">
            {client.niche && <span>{client.niche}</span>}
            {client.niche && client.monthly_fee != null && <span className="text-ink-mute">·</span>}
            {client.monthly_fee != null && <span className="font-semibold text-ink">{formatBRL(client.monthly_fee)}/mês</span>}
          </div>
        )}
        <div className="mt-0.5 flex items-center gap-1 text-xs text-ink-mute">
          <Instagram size={12} />
          {account ? <span className="font-medium text-emerald-600">@{account.username} conectado</span> : client.instagram_handle || "Instagram não conectado"}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-1.5 text-[11px] font-semibold">
          {[
            ["Rascunho", posts.filter((p) => p.status === "draft").length, "bg-slate-50 text-slate-600 ring-slate-200", "bg-slate-400"],
            ["Ajuste", posts.filter((p) => p.status === "changes_requested").length, "bg-rose-50 text-rose-600 ring-rose-100", "bg-rose-500"],
            ["Aprovação", posts.filter((p) => p.status === "in_review").length, "bg-amber-50 text-amber-700 ring-amber-100", "bg-amber-400"],
            ["Aprovados", posts.filter((p) => ["approved", "scheduled", "publishing", "published"].includes(p.status)).length, "bg-emerald-50 text-emerald-700 ring-emerald-100", "bg-emerald-500"],
          ].map(([l, n, cls, dot]) => (
            <span key={l} className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 ring-1 ${cls}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />{n} {l}
            </span>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="aspect-[4/5] overflow-hidden rounded-lg bg-paper">
              {thumbs[i] && <MediaView item={thumbs[i].media[0]} className="h-full w-full object-cover transition group-hover:scale-105" />}
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-ink-soft">
          <span>{posts.length} posts</span>
          {footer}
        </div>
      </div>
    </Link>
  );
}
