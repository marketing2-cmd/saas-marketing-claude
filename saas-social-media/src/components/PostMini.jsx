"use client";

import { Avatar, MediaView } from "./PostPreview";
import StatusBadge from "./StatusBadge";
import { formatDateTime } from "@/lib/posts";

// Linha compacta de post (thumb + título + cliente + status)
export default function PostMini({ post, client, onClick }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition hover:bg-paper">
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-paper">
        {post.media?.[0] ? <MediaView item={post.media[0]} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><Avatar client={client} size={30} /></div>}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{post.title || post.caption?.slice(0, 60) || "Sem título"}</div>
        <div className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-ink-mute">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: client?.color }} />
          {client?.name} · {formatDateTime(post.scheduled_at)}
        </div>
      </div>
      <StatusBadge status={post.status} className="hidden sm:inline-flex" />
    </button>
  );
}
