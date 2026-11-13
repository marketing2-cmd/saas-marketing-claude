"use client";

import { Clapperboard, Copy, ImageIcon } from "lucide-react";
import { MediaView } from "./PostPreview";
import { STATUSES } from "@/lib/posts";

// Grade 3 colunas estilo perfil do Instagram. Stories não aparecem no feed.
export default function FeedGrid({ posts, onOpen }) {
  const feed = posts
    .filter((p) => p.format !== "story")
    .sort((a, b) => {
      const da = a.scheduled_at ? new Date(a.scheduled_at).getTime() : Infinity;
      const db = b.scheduled_at ? new Date(b.scheduled_at).getTime() : Infinity;
      return db - da;
    });

  if (!feed.length) return <div className="card p-10 text-center text-sm text-ink-mute">Nenhum post no feed ainda.</div>;

  return (
    <div className="grid grid-cols-3 gap-0.5 overflow-hidden rounded-xl border border-line bg-line">
      {feed.map((p) => (
        <button key={p.id} onClick={() => onOpen?.(p)} className="group relative aspect-[4/5] bg-paper" disabled={!onOpen}>
          {p.media?.[0] ? (
            <MediaView item={p.media[0]} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center p-2 text-center text-xs text-ink-mute">
              <div><ImageIcon size={20} className="mx-auto mb-1" />{p.title || "Sem mídia"}</div>
            </div>
          )}
          <span className="absolute right-1.5 top-1.5 text-white drop-shadow">
            {p.format === "reels" ? <Clapperboard size={16} /> : p.format === "carousel" || p.media?.length > 1 ? <Copy size={16} /> : null}
          </span>
          <span className={`absolute bottom-1.5 left-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-white ${STATUSES[p.status].dot}`} title={STATUSES[p.status].label} />
        </button>
      ))}
    </div>
  );
}
