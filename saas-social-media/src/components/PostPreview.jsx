"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Heart, ImageIcon, MessageCircle, Send } from "lucide-react";

// Simulação de um post do Instagram (usada no editor e no portal do cliente)
export default function PostPreview({ client, post }) {
  const [index, setIndex] = useState(0);
  const media = post.media || [];
  const current = media[Math.min(index, media.length - 1)];
  const handle = client?.instagram_handle?.replace(/^@/, "") || client?.name?.toLowerCase().replace(/\s+/g, "") || "perfil";
  const aspect = post.format === "reels" || post.format === "story" ? "aspect-[9/16]" : "aspect-[4/5]";

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <Avatar client={client} size={28} />
        <span className="text-sm font-semibold">{handle}</span>
      </div>
      <div className={`relative ${aspect} max-h-[520px] w-full bg-paper`}>
        {current ? <MediaView item={current} className="h-full w-full object-cover" controls /> : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-ink-mute">
            <ImageIcon size={32} />
            <span className="text-xs">Sem mídia</span>
          </div>
        )}
        {media.length > 1 && (
          <>
            <button type="button" onClick={() => setIndex((i) => Math.max(0, i - 1))} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-1 shadow" aria-label="Anterior">
              <ChevronLeft size={16} />
            </button>
            <button type="button" onClick={() => setIndex((i) => Math.min(media.length - 1, i + 1))} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-1 shadow" aria-label="Próxima">
              <ChevronRight size={16} />
            </button>
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
              {media.map((_, i) => (
                <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === index ? "bg-white" : "bg-white/50"}`} />
              ))}
            </div>
          </>
        )}
      </div>
      <div className="flex gap-4 px-3 pt-3 text-ink">
        <Heart size={22} /> <MessageCircle size={22} /> <Send size={22} />
      </div>
      <p className="whitespace-pre-wrap break-words px-3 pb-4 pt-2 text-sm">
        <span className="font-semibold">{handle}</span> {post.caption || <span className="text-ink-mute">Legenda do post…</span>}
      </p>
    </div>
  );
}

export function MediaView({ item, className = "", controls = false }) {
  if (!item) return null;
  if (item.type === "video") {
    return <video src={item.url} className={className} controls={controls} muted playsInline preload="metadata" />;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={item.url} alt="" className={className} />;
}

export function Avatar({ client, size = 32 }) {
  const initials = (client?.name || "?").split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{ width: size, height: size, background: client?.color || "#6D4AFF", fontSize: size * 0.38 }}
    >
      {initials}
    </span>
  );
}
