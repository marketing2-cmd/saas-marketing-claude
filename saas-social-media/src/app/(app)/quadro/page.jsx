"use client";

import { useState } from "react";
import { useWorkspace } from "@/components/WorkspaceProvider";
import ClientFilter from "@/components/ClientFilter";
import { Avatar, MediaView } from "@/components/PostPreview";
import { BOARD_COLUMNS, STATUSES, formatDateTime } from "@/lib/posts";

export default function BoardPage() {
  const { loading, posts, clientById, openEditor, setPostStatus } = useWorkspace();
  const [clientId, setClientId] = useState("");
  const [dragging, setDragging] = useState(null);
  const [over, setOver] = useState(null);

  const visible = posts.filter((p) => !clientId || p.client_id === clientId);
  const columns = [...BOARD_COLUMNS];
  ["publishing", "failed"].forEach((s) => visible.some((p) => p.status === s) && columns.push(s));

  async function drop(status) {
    const post = posts.find((p) => p.id === dragging);
    setDragging(null);
    setOver(null);
    if (!post || post.status === status || status === "published" || status === "failed" || status === "publishing") return;
    await setPostStatus(post, status);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Quadro de conteúdo</h1>
          <p className="mt-1 text-sm text-ink-soft">Arraste os cards para mudar o status.</p>
        </div>
        <ClientFilter value={clientId} onChange={setClientId} />
      </div>

      {!loading && (
        <div className="mt-6 flex gap-4 overflow-x-auto pb-4">
          {columns.map((status) => {
            const items = visible.filter((p) => p.status === status);
            return (
              <div
                key={status}
                onDragOver={(e) => { e.preventDefault(); setOver(status); }}
                onDragLeave={() => setOver(null)}
                onDrop={() => drop(status)}
                className={`w-72 shrink-0 rounded-xl p-2 transition ${over === status ? "bg-brand-soft" : "bg-slate-100/70"}`}
              >
                <div className="flex items-center justify-between px-2 py-1.5">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <span className={`h-2 w-2 rounded-full ${STATUSES[status].dot}`} />{STATUSES[status].label}
                  </span>
                  <span className="text-xs text-ink-mute">{items.length}</span>
                </div>
                <div className="mt-1 space-y-2">
                  {items.map((p) => (
                    <div
                      key={p.id}
                      draggable={!["published", "publishing"].includes(p.status)}
                      onDragStart={() => setDragging(p.id)}
                      onClick={() => openEditor(p)}
                      className="card cursor-pointer overflow-hidden transition hover:border-brand"
                    >
                      {p.media?.[0] && <MediaView item={p.media[0]} className="h-32 w-full object-cover" />}
                      <div className="p-3">
                        <div className="flex items-center gap-2 text-xs text-ink-soft">
                          <Avatar client={clientById[p.client_id]} size={18} />
                          <span className="truncate">{clientById[p.client_id]?.name}</span>
                        </div>
                        <div className="mt-1.5 line-clamp-2 text-sm font-semibold">{p.title || p.caption || "Sem título"}</div>
                        <div className="mt-1.5 text-xs text-ink-mute">{formatDateTime(p.scheduled_at)}</div>
                        {p.tags?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {p.tags.map((t) => <span key={t} className="rounded bg-paper px-1.5 py-0.5 text-[10px] text-ink-soft">#{t}</span>)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
