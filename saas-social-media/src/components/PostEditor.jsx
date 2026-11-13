"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Loader2, Send, Trash2, Upload, X } from "lucide-react";
import { useWorkspace } from "./WorkspaceProvider";
import PostPreview, { MediaView } from "./PostPreview";
import StatusBadge from "./StatusBadge";
import { FORMATS, formatDateTime, fromLocalInput, toLocalInput } from "@/lib/posts";

const CAPTION_LIMIT = 2200;

export default function PostEditor({ initial, onClose }) {
  const { clients, clientById, savePost, setPostStatus, deletePost, uploadMedia, listComments, addComment, notify } = useWorkspace();
  const [post, setPost] = useState(() => ({
    client_id: clients[0]?.id || "",
    title: "",
    caption: "",
    format: "feed",
    tags: [],
    media: [],
    status: "draft",
    scheduled_at: null,
    ...initial,
  }));
  const [tagsText, setTagsText] = useState((initial.tags || []).join(", "));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    if (post.id) listComments(post.id).then(setComments);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = (patch) => setPost((p) => ({ ...p, ...patch }));
  const client = clientById[post.client_id];

  if (!clients.length) {
    return (
      <Modal onClose={onClose}>
        <div className="p-8 text-center">
          <h2 className="text-lg font-bold">Cadastre um cliente primeiro</h2>
          <p className="mt-2 text-sm text-ink-soft">Cada post pertence a um cliente. Vá em <b>Clientes</b> e crie o primeiro.</p>
          <a href="/clientes" className="btn-primary mt-6">Ir para Clientes</a>
        </div>
      </Modal>
    );
  }

  async function handleFiles(files) {
    setUploading(true);
    const uploaded = [];
    for (const file of files) {
      const item = await uploadMedia(file);
      if (item) uploaded.push(item);
    }
    setUploading(false);
    set({ media: [...post.media, ...uploaded], format: post.media.length + uploaded.length > 1 && post.format === "feed" ? "carousel" : post.format });
  }

  function moveMedia(i, dir) {
    const media = [...post.media];
    const j = i + dir;
    if (j < 0 || j >= media.length) return;
    [media[i], media[j]] = [media[j], media[i]];
    set({ media });
  }

  async function save(nextStatus) {
    if (!post.client_id) return notify("Escolha um cliente.", "error");
    setSaving(true);
    const tags = tagsText.split(",").map((t) => t.trim()).filter(Boolean);
    let saved = await savePost({ ...post, tags });
    if (saved && nextStatus && nextStatus !== saved.status) saved = await setPostStatus(saved, nextStatus);
    setSaving(false);
    if (!saved) return;
    notify(
      nextStatus === "in_review"
        ? "Enviado para aprovação do cliente."
        : nextStatus === "approved"
        ? saved.status === "scheduled" ? "Aprovado e agendado." : "Aprovado."
        : "Post salvo."
    );
    onClose();
  }

  async function remove() {
    if (!confirm("Excluir este post?")) return;
    await deletePost(post.id);
    onClose();
  }

  async function sendComment(e) {
    e.preventDefault();
    if (!comment.trim()) return;
    const c = await addComment(post.id, comment.trim());
    if (c) setComments((list) => [...list, c]);
    setComment("");
  }

  const locked = post.status === "published";

  return (
    <Modal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold">{post.id ? "Editar post" : "Novo post"}</h2>
          {post.id && <StatusBadge status={post.status} />}
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-paper" aria-label="Fechar"><X size={18} /></button>
      </div>

      <div className="grid gap-6 overflow-y-auto p-5 md:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {post.status === "failed" && post.publish_error && (
            <div className="flex gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
              <AlertTriangle size={18} className="shrink-0" /> <span><b>Falha ao publicar:</b> {post.publish_error}</span>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Cliente</label>
              <select className="input" value={post.client_id} onChange={(e) => set({ client_id: e.target.value })} disabled={locked}>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Formato</label>
              <select className="input" value={post.format} onChange={(e) => set({ format: e.target.value })} disabled={locked}>
                {Object.entries(FORMATS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Título interno</label>
            <input className="input" placeholder="Ex.: Lançamento coleção de verão" value={post.title} onChange={(e) => set({ title: e.target.value })} disabled={locked} />
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <label className="label">Legenda</label>
              <span className={`text-xs ${post.caption.length > CAPTION_LIMIT ? "text-rose-600" : "text-ink-mute"}`}>{post.caption.length}/{CAPTION_LIMIT}</span>
            </div>
            <textarea className="input min-h-[140px] resize-y" value={post.caption} onChange={(e) => set({ caption: e.target.value })} disabled={locked} />
          </div>

          <div>
            <label className="label">Mídia</label>
            <div className="flex flex-wrap gap-2">
              {post.media.map((m, i) => (
                <div key={m.path} className="group relative h-24 w-24 overflow-hidden rounded-lg border border-line">
                  <MediaView item={m} className="h-full w-full object-cover" />
                  {!locked && (
                    <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/60 to-transparent p-1 opacity-0 transition group-hover:opacity-100">
                      <button type="button" onClick={() => moveMedia(i, -1)} className="rounded bg-white/90 p-0.5" aria-label="Mover para a esquerda"><ArrowLeft size={12} /></button>
                      <button type="button" onClick={() => set({ media: post.media.filter((_, k) => k !== i) })} className="rounded bg-white/90 p-0.5 text-rose-600" aria-label="Remover"><Trash2 size={12} /></button>
                      <button type="button" onClick={() => moveMedia(i, 1)} className="rounded bg-white/90 p-0.5" aria-label="Mover para a direita"><ArrowRight size={12} /></button>
                    </div>
                  )}
                </div>
              ))}
              {!locked && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-line text-xs text-ink-mute hover:border-brand hover:text-brand"
                >
                  {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                  {uploading ? "Enviando…" : "Adicionar"}
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,video/mp4,video/quicktime"
                multiple
                hidden
                onChange={(e) => { handleFiles([...e.target.files]); e.target.value = ""; }}
              />
            </div>
            <p className="mt-1 text-xs text-ink-mute">JPG ou PNG para imagens, MP4/MOV para vídeos. Para Instagram, prefira 1080×1350.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Data e hora de publicação</label>
              <input type="datetime-local" className="input" value={toLocalInput(post.scheduled_at)} onChange={(e) => set({ scheduled_at: fromLocalInput(e.target.value) })} disabled={locked} />
            </div>
            <div>
              <label className="label">Tags (separe com vírgula)</label>
              <input className="input" placeholder="promoção, institucional" value={tagsText} onChange={(e) => setTagsText(e.target.value)} disabled={locked} />
            </div>
          </div>

          {post.id && (
            <div>
              <label className="label">Comentários</label>
              <div className="space-y-2 rounded-lg border border-line bg-paper p-3">
                {comments.length === 0 && <p className="text-xs text-ink-mute">Nenhum comentário ainda.</p>}
                {comments.map((c) => (
                  <div key={c.id} className={`rounded-lg px-3 py-2 text-sm ${c.author_type === "client" ? "bg-amber-50" : "bg-white"}`}>
                    <div className="mb-0.5 text-xs font-semibold text-ink-soft">
                      {c.author_type === "client" ? `Cliente${c.author_name ? ` · ${c.author_name}` : ""}` : c.author_name} · {formatDateTime(c.created_at)}
                    </div>
                    <div className="whitespace-pre-wrap">{c.body}</div>
                  </div>
                ))}
                <form onSubmit={sendComment} className="flex gap-2 pt-1">
                  <input className="input" placeholder="Escreva um comentário…" value={comment} onChange={(e) => setComment(e.target.value)} />
                  <button className="btn-ghost px-3" aria-label="Enviar comentário"><Send size={16} /></button>
                </form>
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="label">Prévia</div>
          <PostPreview client={client} post={post} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-5 py-4">
        <div>
          {post.id && (
            <button onClick={remove} className="btn text-rose-600 hover:bg-rose-50"><Trash2 size={16} /> Excluir</button>
          )}
        </div>
        {!locked && (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => save()} className="btn-ghost" disabled={saving || uploading}>Salvar</button>
            <button onClick={() => save("approved")} className="btn-ghost" disabled={saving || uploading} title="Aprovar sem passar pelo cliente">
              <CheckCircle2 size={16} /> Aprovar
            </button>
            <button onClick={() => save("in_review")} className="btn-primary" disabled={saving || uploading}>
              <Send size={16} /> Enviar para aprovação
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="flex max-h-[95vh] w-full max-w-5xl flex-col rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">{children}</div>
    </div>
  );
}
