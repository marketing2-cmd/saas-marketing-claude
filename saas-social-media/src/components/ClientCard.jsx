"use client";

import Link from "next/link";
import { Instagram } from "lucide-react";
import { Avatar, MediaView } from "./PostPreview";
import { clientGradient } from "@/lib/posts";

// Card de cliente com banner em degradê pastel
export default function ClientCard({ client, posts, account, href, footer }) {
  const pending = posts.filter((p) => p.status === "in_review").length;
  const thumbs = posts.filter((p) => p.media?.[0] && p.format !== "story").slice(0, 3);
  return (
    <Link href={href} className="card group overflow-hidden transition hover:-translate-y-0.5 hover:shadow-float">
      <div className="relative h-20" style={{ background: clientGradient(client.color) }}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(255,255,255,.7),transparent_45%)]" />
        {pending > 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-amber-700 shadow-sm">
            {pending} em aprovação
          </span>
        )}
      </div>
      <div className="-mt-7 px-4 pb-4">
        <div className="inline-block rounded-full bg-white p-1 shadow-soft"><Avatar client={client} size={46} /></div>
        <div className="mt-1.5 font-bold">{client.name}</div>
        <div className="mt-0.5 flex items-center gap-1 text-xs text-ink-mute">
          <Instagram size={12} />
          {account ? <span className="font-medium text-emerald-600">@{account.username} conectado</span> : client.instagram_handle || "Instagram não conectado"}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-1.5">
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
