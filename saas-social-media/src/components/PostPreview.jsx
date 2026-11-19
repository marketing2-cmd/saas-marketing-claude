"use client";

import { useRef, useState } from "react";
import { Bookmark, ChevronLeft, ChevronRight, Clapperboard, Heart, ImageIcon, MessageCircle, MoreHorizontal, Music2, Send } from "lucide-react";

// Simulação de um post do Instagram (usada no editor e no portal do cliente)
export default function PostPreview({ client, post }) {
  if (post.format === "story") return <StoryPreview client={client} post={post} />;
  if (post.format === "reels") return <ReelsPreview client={client} post={post} />;
  return <FeedPreview client={client} post={post} />;
}

function handleOf(client) {
  return client?.instagram_handle?.replace(/^@/, "") || client?.name?.toLowerCase().replace(/\s+/g, "") || "perfil";
}

function EmptyMedia({ dark = false }) {
  return (
    <div className={`flex h-full w-full flex-col items-center justify-center gap-2 ${dark ? "text-white/60" : "text-ink-mute"}`}>
      <ImageIcon size={32} />
      <span className="text-xs">Sem mídia</span>
    </div>
  );
}

// Story: tela vertical com barra de progresso no topo, sem legenda
function StoryPreview({ client, post }) {
  const item = post.media?.[0];
  return (
    <div className="mx-auto w-full max-w-[300px]">
      <div className="relative aspect-[9/16] w-full overflow-hidden rounded-[22px] bg-neutral-900 shadow-soft">
        {item ? <MediaView item={item} className="h-full w-full object-cover" controls /> : <EmptyMedia dark />}
        <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/50 to-transparent p-3">
          <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/40"><div className="h-full w-1/3 rounded-full bg-white" /></div>
          <div className="mt-2.5 flex items-center gap-2 text-white">
            <Avatar client={client} size={26} />
            <span className="text-[13px] font-semibold">{handleOf(client)}</span>
            <span className="text-[12px] text-white/70">agora</span>
            <MoreHorizontal size={16} className="ml-auto" />
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-2 p-3">
          <div className="flex-1 rounded-full border border-white/60 px-3 py-1.5 text-[12px] text-white/80">Enviar mensagem</div>
          <Heart size={20} className="text-white" />
          <Send size={20} className="text-white" />
        </div>
      </div>
      <p className="mt-2 text-center text-[11px] text-ink-mute">Prévia de Story — legenda não aparece no Instagram</p>
    </div>
  );
}

// Reels: vídeo vertical com legenda sobreposta e ações na lateral
function ReelsPreview({ client, post }) {
  const item = post.media?.[0];
  return (
    <div className="mx-auto w-full max-w-[300px]">
      <div className="relative aspect-[9/16] w-full overflow-hidden rounded-[22px] bg-neutral-900 shadow-soft">
        {item ? <MediaView item={item} className="h-full w-full object-cover" controls /> : <EmptyMedia dark />}
        <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 text-[14px] font-semibold text-white drop-shadow">
          <Clapperboard size={16} /> Reels
        </div>
        <div className="pointer-events-none absolute bottom-16 right-3 flex flex-col items-center gap-4 text-white drop-shadow">
          <Heart size={22} /><MessageCircle size={22} /><Send size={22} /><Bookmark size={22} />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 pr-12 text-white">
          <div className="flex items-center gap-2">
            <Avatar client={client} size={24} />
            <span className="text-[13px] font-semibold">{handleOf(client)}</span>
          </div>
          <p className="mt-1.5 line-clamp-2 text-[12px] leading-snug">{post.caption || "Legenda do Reels…"}</p>
          <div className="mt-1.5 flex items-center gap-1 text-[11px] text-white/80"><Music2 size={12} /> Áudio original</div>
        </div>
      </div>
      <p className="mt-2 text-center text-[11px] text-ink-mute">
        Prévia de Reels{post.reels_share_to_feed === false ? " · só na aba Reels" : " · também aparece no feed"}
      </p>
    </div>
  );
}

function FeedPreview({ client, post }) {
  const [index, setIndex] = useState(0);
  const touch = useRef(null);
  const media = post.media || [];
  const go = (dir) => setIndex((i) => Math.min(media.length - 1, Math.max(0, i + dir)));
  const current = media[Math.min(index, media.length - 1)];
  const handle = client?.instagram_handle?.replace(/^@/, "") || client?.name?.toLowerCase().replace(/\s+/g, "") || "perfil";
  const aspect = post.format === "reels" || post.format === "story" ? "aspect-[9/16]" : "aspect-[4/5]";

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-soft">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className="rounded-full bg-gradient-to-tr from-[#FEDA75] via-[#D62976] to-[#4F5BD5] p-[2px]"><span className="block rounded-full bg-white p-[1.5px]"><Avatar client={client} size={26} /></span></span>
        <span className="text-sm font-semibold">{handle}</span>
      </div>
      <div
        className={`relative ${aspect} max-h-[520px] w-full touch-pan-y bg-paper`}
        onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touch.current === null) return;
          const dx = e.changedTouches[0].clientX - touch.current;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
          touch.current = null;
        }}
      >
        {current ? <MediaView item={current} className="h-full w-full object-cover" controls /> : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-ink-mute">
            <ImageIcon size={32} />
            <span className="text-xs">Sem mídia</span>
          </div>
        )}
        {media.length > 1 && (
          <>
            <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">{Math.min(index, media.length - 1) + 1}/{media.length}</span>
            <button type="button" onClick={() => go(-1)} disabled={index === 0} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-1 shadow disabled:opacity-0" aria-label="Anterior">
              <ChevronLeft size={16} />
            </button>
            <button type="button" onClick={() => go(1)} disabled={index >= media.length - 1} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-1 shadow disabled:opacity-0" aria-label="Próxima">
              <ChevronRight size={16} />
            </button>
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
              {media.map((_, i) => (
                <button type="button" key={i} onClick={() => setIndex(i)} aria-label={`Mídia ${i + 1}`} className={`h-1.5 w-1.5 rounded-full ${i === index ? "bg-white" : "bg-white/50"}`} />
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
  if (client?.avatar_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={client.avatar_url}
        alt=""
        className="inline-block shrink-0 rounded-full bg-paper object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{ width: size, height: size, background: client?.color || "#6D4AFF", fontSize: size * 0.38 }}
    >
      {initials}
    </span>
  );
}
