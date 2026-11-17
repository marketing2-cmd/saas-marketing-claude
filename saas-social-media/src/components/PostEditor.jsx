"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ImagePlus,
  Link2,
  Loader2,
  MessageSquare,
  RotateCcw,
  Send,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useWorkspace } from "./WorkspaceProvider";
import PostPreview, { Avatar, MediaView } from "./PostPreview";
import StatusBadge from "./StatusBadge";
import MemberAvatar from "./MemberAvatar";
import { memberName, membersForStage, stageDue } from "@/lib/team";
import { FORMATS, STAGES, STAGE_STATUSES, derivePostStatus, formatDateTime, fromLocalInput, getAssignees, getStages, isStageEmpty, skipEmptyStages, toLocalInput } from "@/lib/posts";

const CAPTION_LIMIT = 2200;
const NETWORKS = [
  ["instagram", "Instagram"],
  ["facebook", "Facebook"],
  ["tiktok", "TikTok"],
];

const snapshot = (p, st, as) => JSON.stringify({ ...p, _stage: undefined, stagesState: st, assigneesState: as });

// Editor de conteúdo em tela cheia: prévia à esquerda e as etapas
// Tema → Conteúdo → Mídia → Legenda, cada uma com status próprio.
export default function PostEditor({ initial, onClose }) {
  const { href, clients, clientById, savePost, deletePost, uploadMedia, listComments, addComment, notify, members, memberById, deadlines } = useWorkspace();
  const [post, setPost] = useState(() => ({
    client_id: clients[0]?.id || "",
    title: "",
    caption: "",
    format: "feed",
    networks: ["instagram"],
    tags: [],
    media: [],
    status: "draft",
    scheduled_at: null,
    theme: "",
    reference_links: [],
    content_text: "",
    designer_notes: "",
    ...initial,
  }));
  const [stages, setStages] = useState(() => getStages({ status: "draft", ...initial }));
  // Responsáveis: do post, ou o time padrão do cliente para conteúdos novos
  const [assignees, setAssignees] = useState(() => {
    const own = getAssignees(initial);
    if (initial.id) return own;
    const team = clientById[initial.client_id || clients[0]?.id]?.default_team || {};
    return Object.fromEntries(STAGES.map(({ key }) => [key, own[key] || team[key] || null]));
  });
  const [savedSnap, setSavedSnap] = useState(() => (initial.id ? snapshot({ ...post }, getStages(initial), getAssignees(initial)) : null));
  const [active, setActive] = useState(initial._stage && STAGES.some((s) => s.key === initial._stage) ? initial._stage : "theme");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const fileRef = useRef(null);

  const dirty = savedSnap === null ? true : snapshot(post, stages, assignees) !== savedSnap;
  const locked = post.status === "published" || post.status === "publishing";
  const client = clientById[post.client_id];
  const overall = derivePostStatus({ status: post.status, scheduled_at: post.scheduled_at }, stages);
  const set = (patch) => setPost((p) => ({ ...p, ...patch }));

  useEffect(() => {
    if (post.id) listComments(post.id).then(setComments);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  function close() {
    if (dirty && post.id !== undefined && !confirm("Sair sem salvar as alterações?")) return;
    if (dirty && post.id === undefined && (post.theme || post.caption || post.media.length) && !confirm("Descartar este conteúdo?")) return;
    onClose();
  }

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!clients.length) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4">
        <div className="card max-w-sm p-8 text-center">
          <h2 className="text-lg font-bold">Cadastre um cliente primeiro</h2>
          <p className="mt-2 text-sm text-ink-soft">Cada conteúdo pertence a um cliente.</p>
          <div className="mt-6 flex justify-center gap-2">
            <button onClick={onClose} className="btn-ghost">Fechar</button>
            <a href={href("/clientes")} className="btn-primary">Ir para Clientes</a>
          </div>
        </div>
      </div>
    );
  }

  // Salva; nextStages permite mudar o status de etapas no mesmo clique
  async function save(nextStages = stages, message = "Conteúdo salvo.") {
    if (!post.client_id) return notify("Escolha um cliente.", "error");
    setSaving(true);
    const saved = await savePost({ ...post, stagesState: nextStages, assigneesState: assignees });
    setSaving(false);
    if (!saved) return null;
    const fresh = { ...post, ...saved };
    const st = getStages(saved);
    const as = getAssignees(saved);
    setPost(fresh);
    setStages(st);
    setAssignees(as);
    setSavedSnap(snapshot(fresh, st, as));
    notify(message);
    return saved;
  }

  function stageAction(key, status) {
    if (status === "in_review" && isStageEmpty(post, key)) {
      notify("Preencha esta etapa antes de enviar para aprovação.", "error");
      return null;
    }
    const next = { ...stages, [key]: status };
    const label = STAGES.find((s) => s.key === key).label;
    const msg = status === "in_review" ? `Etapa "${label}" enviada para aprovação.` : status === "approved" ? `Etapa "${label}" aprovada.` : `Etapa "${label}" voltou para rascunho.`;
    return save(next, msg);
  }

  function allAction(status) {
    let next = Object.fromEntries(STAGES.map(({ key }) => [key, status === "in_review" && stages[key] === "approved" ? "approved" : status]));
    // Etapas sem conteúdo não vão para o cliente
    if (status === "in_review") next = skipEmptyStages(post, next);
    const msg = status === "in_review" ? "Enviado para aprovação do cliente." : "Conteúdo aprovado.";
    return save(next, post.scheduled_at && status === "approved" ? "Aprovado e agendado." : msg);
  }

  async function remove() {
    if (!confirm("Excluir este conteúdo?")) return;
    await deletePost(post.id);
    onClose();
  }

  async function handleFiles(files) {
    setUploading(true);
    const uploaded = [];
    for (const file of files) {
      const item = await uploadMedia(file);
      if (item) uploaded.push(item);
    }
    setUploading(false);
    const media = [...post.media, ...uploaded];
    set({ media, format: media.length > 1 && post.format === "feed" ? "carousel" : post.format });
  }

  function moveMedia(i, dir) {
    const media = [...post.media];
    const j = i + dir;
    if (j < 0 || j >= media.length) return;
    [media[i], media[j]] = [media[j], media[i]];
    set({ media });
  }

  async function sendComment(body, stage) {
    let id = post.id;
    if (!id) {
      const saved = await save(stages, "Conteúdo salvo.");
      if (!saved) return;
      id = saved.id;
    }
    const c = await addComment(id, body, stage);
    if (c) setComments((list) => [...list, c]);
  }

  const stageIndex = STAGES.findIndex((s) => s.key === active);
  const st = stages[active];
  const stageComments = comments.filter((c) => c.stage === active);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-paper" role="dialog" aria-modal="true" aria-label={post.id ? "Editar conteúdo" : "Novo conteúdo"}>
      {/* Barra superior */}
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-line bg-white px-3 sm:px-5">
        <button onClick={close} className="rounded-xl p-2 text-ink-soft hover:bg-paper" aria-label="Voltar"><ArrowLeft size={20} /></button>
        <div className="min-w-0">
          <div className="truncate text-sm font-bold">{post.title || post.theme?.split("\n")[0] || (post.id ? "Conteúdo" : "Novo conteúdo")}</div>
          <div className="flex items-center gap-2">
            <StatusBadge status={overall} />
            {dirty && post.id && <span className="text-[11px] font-medium text-amber-600">não salvo</span>}
          </div>
        </div>
        <div className="flex-1" />
        <label className="hidden items-center gap-2 rounded-xl border border-line bg-white px-3 py-1.5 text-sm md:flex">
          <CalendarClock size={16} className="text-ink-mute" />
          <input type="datetime-local" className="bg-transparent text-sm outline-none" value={toLocalInput(post.scheduled_at)} onChange={(e) => set({ scheduled_at: fromLocalInput(e.target.value) })} disabled={locked} aria-label="Data e hora de publicação" />
        </label>
        <button onClick={() => setShowComments((v) => !v)} className={`relative rounded-xl border p-2 transition ${showComments ? "border-brand-ring bg-brand-soft text-brand" : "border-line bg-white text-ink-soft hover:text-ink"}`} aria-label="Comentários">
          <MessageSquare size={18} />
          {comments.length > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">{comments.length}</span>}
        </button>
        <button onClick={close} className="hidden rounded-xl p-2 text-ink-soft hover:bg-paper sm:block" aria-label="Fechar"><X size={20} /></button>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[minmax(300px,400px)_minmax(0,1fr)] lg:overflow-hidden">
          {/* Prévia */}
          <aside className="border-line p-4 sm:p-5 lg:overflow-y-auto lg:border-r">
            <div className="card overflow-hidden">
              <div className="flex items-center gap-2.5 border-b border-line px-4 py-3">
                <Avatar client={client} size={34} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold">{client?.instagram_handle?.replace(/^@/, "") || client?.name}</div>
                  <div className="truncate text-xs text-ink-mute">{client?.name}</div>
                </div>
                <select
                  className="input w-auto max-w-[150px] py-1.5 text-xs"
                  value={post.client_id}
                  onChange={(e) => {
                    set({ client_id: e.target.value });
                    const team = clientById[e.target.value]?.default_team || {};
                    setAssignees((a) => Object.fromEntries(STAGES.map(({ key }) => [key, team[key] || a[key] || null])));
                  }}
                  disabled={locked || Boolean(post.id)}
                  aria-label="Cliente"
                >
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              {post.media.length ? (
                <div className="p-3"><PostPreview client={client} post={post} /></div>
              ) : (
                <div className="flex aspect-[4/5] flex-col items-center justify-center gap-2 p-6 text-center text-ink-mute">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-current"><AlertTriangle size={20} /></span>
                  <div className="text-sm font-semibold text-ink-soft">Nenhuma mídia adicionada</div>
                  <button onClick={() => setActive("media")} className="flex items-center gap-1 text-xs font-semibold text-brand hover:underline">
                    Adicione uma mídia na etapa “Mídia” <ArrowRight size={12} />
                  </button>
                </div>
              )}
            </div>
            <label className="mt-3 flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-sm md:hidden">
              <CalendarClock size={16} className="text-ink-mute" />
              <input type="datetime-local" className="flex-1 bg-transparent outline-none" value={toLocalInput(post.scheduled_at)} onChange={(e) => set({ scheduled_at: fromLocalInput(e.target.value) })} disabled={locked} aria-label="Data e hora de publicação" />
            </label>
          </aside>

          {/* Etapas */}
          <main className="space-y-4 p-4 sm:p-5 lg:overflow-y-auto">
            {post.status === "failed" && post.publish_error && (
              <div className="flex gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
                <AlertTriangle size={18} className="shrink-0" /> <span><b>Falha ao publicar:</b> {post.publish_error}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {STAGES.map((s, i) => {
                const ss = STAGE_STATUSES[stages[s.key]];
                const on = s.key === active;
                return (
                  <button
                    key={s.key}
                    onClick={() => setActive(s.key)}
                    className={`flex flex-col items-center gap-1.5 rounded-2xl border bg-white px-3 py-3 transition active:scale-[0.98] ${on ? "border-brand shadow-[0_0_0_3px_rgba(124,92,252,.15)]" : "border-line hover:border-brand-ring"}`}
                  >
                    <span className={`text-sm font-semibold ${on ? "text-brand" : "text-ink"}`}><span className="mr-1 text-ink-mute">{i + 1}.</span>{s.label}</span>
                    <span className="flex items-center gap-1.5">
                      <span className={`chip ${ss.color}`}><span className={`h-1.5 w-1.5 rounded-full ${ss.dot}`} />{ss.label}</span>
                      {members.length > 0 && <MemberAvatar member={memberById[assignees[s.key]]} size={20} />}
                    </span>
                  </button>
                );
              })}
            </div>

            <section className="card p-5">
              {members.length > 0 && (
                <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl bg-paper/70 px-3 py-2 ring-1 ring-line">
                  <MemberAvatar member={memberById[assignees[active]]} size={28} />
                  <label className="text-xs font-semibold text-ink-soft" htmlFor="pe-assignee">Responsável</label>
                  <select
                    id="pe-assignee"
                    className="input w-auto min-w-[180px] bg-white py-1.5 text-sm"
                    value={assignees[active] || ""}
                    onChange={(e) => setAssignees((a) => ({ ...a, [active]: e.target.value || null }))}
                    disabled={locked}
                  >
                    <option value="">Sem responsável</option>
                    {membersForStage(members, active).map((m) => <option key={m.user_id} value={m.user_id}>{memberName(m)}</option>)}
                  </select>
                  {stageDue(post, active, deadlines) && (
                    <span className={`ml-auto text-xs font-medium ${stageDue(post, active, deadlines) < new Date() && stages[active] !== "approved" ? "text-rose-600" : "text-ink-mute"}`}>
                      Prazo: {stageDue(post, active, deadlines).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                    </span>
                  )}
                </div>
              )}
              {active === "theme" && (
                <div className="space-y-4">
                  <div>
                    <label className="label" htmlFor="pe-theme">Tema da publicação</label>
                    <textarea id="pe-theme" className="input min-h-[110px] resize-y" placeholder="Sobre o que é este conteúdo? Qual a ideia principal?" value={post.theme} onChange={(e) => set({ theme: e.target.value })} disabled={locked} />
                  </div>
                  <div>
                    <span className="label">Referências</span>
                    <div className="space-y-2">
                      {["primeiro", "segundo", "terceiro"].map((n, i) => (
                        <div key={n} className="relative">
                          <Link2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" />
                          <input
                            className="input pl-9"
                            type="url"
                            placeholder={`Cole o ${n} link de referência…`}
                            value={post.reference_links?.[i] || ""}
                            onChange={(e) => {
                              const links = [...(post.reference_links || [])];
                              links[i] = e.target.value;
                              set({ reference_links: links });
                            }}
                            disabled={locked}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-8 gap-y-3">
                    <div>
                      <span className="label">Redes</span>
                      <div className="flex flex-wrap gap-1.5">
                        {NETWORKS.map(([k, l]) => {
                          const on = post.networks?.includes(k);
                          return (
                            <button key={k} type="button" disabled={locked} onClick={() => set({ networks: on ? post.networks.filter((x) => x !== k) : [...(post.networks || []), k] })} className={`chip px-3 py-1.5 text-xs transition ${on ? "bg-navy text-white" : "bg-paper text-ink-soft ring-1 ring-line"}`}>
                              {l}
                            </button>
                          );
                        })}
                      </div>
                      {post.networks?.some((n) => n !== "instagram") && <p className="mt-1 text-[11px] text-ink-mute">Publicação automática disponível por enquanto só no Instagram.</p>}
                    </div>
                    <div>
                      <span className="label">Formato</span>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(FORMATS).map(([k, l]) => (
                          <button key={k} type="button" disabled={locked} onClick={() => set({ format: k })} className={`chip px-3 py-1.5 text-xs transition ${post.format === k ? "bg-navy text-white" : "bg-paper text-ink-soft ring-1 ring-line"}`}>
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="label" htmlFor="pe-title">Título interno</label>
                      <input id="pe-title" className="input" placeholder="Ex.: Lançamento coleção de verão" value={post.title} onChange={(e) => set({ title: e.target.value })} disabled={locked} />
                    </div>
                    <div>
                      <label className="label" htmlFor="pe-tags">Tags (separe com vírgula)</label>
                      <input id="pe-tags" className="input" placeholder="promoção, institucional" defaultValue={(post.tags || []).join(", ")} onBlur={(e) => set({ tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })} disabled={locked} />
                    </div>
                  </div>
                </div>
              )}

              {active === "content" && (
                <div className="space-y-4">
                  <div>
                    <label className="label" htmlFor="pe-content">
                      {post.format === "reels" ? "Roteiro do vídeo" : post.format === "carousel" ? "Texto de cada slide" : post.format === "story" ? "Texto dos stories" : "Texto da arte"}
                    </label>
                    <textarea
                      id="pe-content"
                      className="input min-h-[220px] resize-y font-[inherit]"
                      placeholder={post.format === "carousel" ? "Slide 1: …\nSlide 2: …\nSlide 3: …" : post.format === "reels" ? "Gancho (0–3s): …\nDesenvolvimento: …\nChamada para ação: …" : "O que vai escrito na arte"}
                      value={post.content_text}
                      onChange={(e) => set({ content_text: e.target.value })}
                      disabled={locked}
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="pe-notes">Observações para o designer / editor</label>
                    <textarea id="pe-notes" className="input min-h-[90px] resize-y" placeholder="Cores, fontes, referências visuais, cenas…" value={post.designer_notes} onChange={(e) => set({ designer_notes: e.target.value })} disabled={locked} />
                  </div>
                </div>
              )}

              {active === "media" && (
                <div>
                  <span className="label">Imagens e vídeos</span>
                  <div className="flex flex-wrap gap-3">
                    {post.media.map((m, i) => (
                      <div key={m.path} className="group relative h-32 w-28 overflow-hidden rounded-xl border border-line">
                        <MediaView item={m} className="h-full w-full object-cover" />
                        <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 text-[10px] font-bold text-white">{i + 1}</span>
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
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => { e.preventDefault(); handleFiles([...e.dataTransfer.files]); }}
                        className="flex h-32 w-28 flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-line bg-paper text-xs font-semibold text-ink-mute hover:border-brand-ring hover:text-brand"
                      >
                        {uploading ? <Loader2 size={20} className="animate-spin" /> : post.media.length ? <ImagePlus size={20} /> : <Upload size={20} />}
                        {uploading ? "Enviando…" : "Adicionar"}
                      </button>
                    )}
                    <input ref={fileRef} type="file" accept="image/jpeg,image/png,video/mp4,video/quicktime" multiple hidden onChange={(e) => { handleFiles([...e.target.files]); e.target.value = ""; }} />
                  </div>
                  <p className="mt-3 text-xs text-ink-mute">Arraste arquivos para o quadro ou clique em Adicionar. JPG/PNG para imagens, MP4/MOV para vídeos. Instagram: prefira 1080×1350 (feed) ou 1080×1920 (Reels e Stories).</p>
                </div>
              )}

              {active === "caption" && (
                <div>
                  <div className="flex items-baseline justify-between">
                    <label className="label" htmlFor="pe-caption">Legenda</label>
                    <span className={`text-xs ${post.caption.length > CAPTION_LIMIT ? "font-semibold text-rose-600" : "text-ink-mute"}`}>
                      {post.caption.length}/{CAPTION_LIMIT} · {(post.caption.match(/#[\p{L}\d_]+/gu) || []).length} hashtags
                    </span>
                  </div>
                  <textarea id="pe-caption" className="input min-h-[260px] resize-y" placeholder="Escreva a legenda do post…" value={post.caption} onChange={(e) => set({ caption: e.target.value })} disabled={locked} />
                  {(post.caption.match(/#[\p{L}\d_]+/gu) || []).length > 30 && <p className="mt-1 text-xs font-medium text-rose-600">O Instagram aceita no máximo 30 hashtags.</p>}
                </div>
              )}

              {/* Ações da etapa */}
              {!locked && (
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-ink-soft">Etapa:</span>
                    <span className={`chip ${STAGE_STATUSES[st].color}`}><span className={`h-1.5 w-1.5 rounded-full ${STAGE_STATUSES[st].dot}`} />{STAGE_STATUSES[st].label}</span>
                    {stageComments.length > 0 && (
                      <button onClick={() => setShowComments(true)} className="text-xs font-semibold text-brand hover:underline">{stageComments.length} comentário(s)</button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {st !== "draft" && (
                      <button onClick={() => stageAction(active, "draft")} disabled={saving} className="btn-ghost px-3 py-2 text-xs"><RotateCcw size={14} /> Voltar a rascunho</button>
                    )}
                    {st !== "approved" && (
                      <button onClick={() => stageAction(active, "approved")} disabled={saving} className="btn-ghost px-3 py-2 text-xs" title="Aprovar sem passar pelo cliente"><CheckCircle2 size={14} /> Aprovar etapa</button>
                    )}
                    {st !== "in_review" && st !== "approved" && (
                      <button onClick={() => stageAction(active, "in_review")} disabled={saving || uploading} className="btn-dark px-3 py-2 text-xs"><Send size={14} /> Enviar etapa para aprovação</button>
                    )}
                    {stageIndex < STAGES.length - 1 && (
                      <button onClick={() => setActive(STAGES[stageIndex + 1].key)} className="btn px-3 py-2 text-xs text-brand hover:bg-brand-soft">Próxima etapa <ArrowRight size={14} /></button>
                    )}
                  </div>
                </div>
              )}
            </section>
          </main>
        </div>

        {showComments && (
          <CommentsPanel comments={comments} active={active} onSend={sendComment} onClose={() => setShowComments(false)} />
        )}
      </div>

      {/* Rodapé */}
      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-line bg-white px-3 py-3 sm:px-5">
        <div>
          {post.id && (
            <button onClick={remove} className="btn px-3 text-rose-600 hover:bg-rose-50"><Trash2 size={16} /> <span className="hidden sm:inline">Excluir</span></button>
          )}
        </div>
        {!locked ? (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => save()} className="btn-ghost" disabled={saving || uploading}>
              {saving && <Loader2 size={14} className="animate-spin" />} Salvar
            </button>
            <button onClick={() => allAction("approved")} className="btn-ghost" disabled={saving || uploading} title="Aprovar todas as etapas sem passar pelo cliente">
              <CheckCircle2 size={16} /> <span className="hidden sm:inline">Aprovar tudo</span>
            </button>
            <button onClick={() => allAction("in_review")} className="btn-primary" disabled={saving || uploading}>
              <Send size={16} /> Enviar tudo para aprovação
            </button>
          </div>
        ) : (
          <span className="text-sm text-ink-soft">Publicado em {formatDateTime(post.published_at || post.scheduled_at)}.</span>
        )}
      </footer>
    </div>
  );
}

function CommentsPanel({ comments, active, onSend, onClose }) {
  const [text, setText] = useState("");
  const [stage, setStage] = useState(active);
  const [filter, setFilter] = useState("all");
  const list = useMemo(() => comments.filter((c) => filter === "all" || c.stage === filter || (filter === "general" && !c.stage)), [comments, filter]);
  const stageLabel = (k) => STAGES.find((s) => s.key === k)?.label;

  useEffect(() => setStage(active), [active]);

  async function submit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    await onSend(text.trim(), stage || null);
    setText("");
  }

  return (
    <aside className="fixed inset-y-0 right-0 z-10 flex w-full max-w-sm flex-col border-l border-line bg-white shadow-float sm:static sm:z-auto sm:shadow-none">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h3 className="font-bold">Comentários</h3>
        <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-paper" aria-label="Fechar comentários"><X size={18} /></button>
      </div>
      <div className="flex gap-1 overflow-x-auto border-b border-line px-3 py-2 text-xs">
        {[["all", "Todos"], ...STAGES.map((s) => [s.key, s.label])].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} className={`shrink-0 rounded-lg px-2.5 py-1 font-semibold ${filter === k ? "bg-navy text-white" : "text-ink-soft hover:bg-paper"}`}>{l}</button>
        ))}
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {list.length === 0 && <p className="p-4 text-center text-sm text-ink-mute">Nenhum comentário ainda.</p>}
        {list.map((c) => (
          <div key={c.id} className={`rounded-xl px-3 py-2 text-sm ${c.author_type === "client" ? "bg-amber-50" : "bg-paper"}`}>
            <div className="mb-0.5 flex flex-wrap items-center gap-1.5 text-xs text-ink-soft">
              <b>{c.author_type === "client" ? `Cliente${c.author_name ? ` · ${c.author_name}` : ""}` : c.author_name}</b>
              {c.stage && <span className="chip bg-white px-1.5 py-0 text-[10px] ring-1 ring-line">{stageLabel(c.stage)}</span>}
              <span className="text-ink-mute">{formatDateTime(c.created_at)}</span>
            </div>
            <div className="whitespace-pre-wrap">{c.body}</div>
          </div>
        ))}
      </div>
      <form onSubmit={submit} className="space-y-2 border-t border-line p-3">
        <select className="input py-1.5 text-xs" value={stage || ""} onChange={(e) => setStage(e.target.value)} aria-label="Etapa do comentário">
          <option value="">Geral</option>
          {STAGES.map((s) => <option key={s.key} value={s.key}>Etapa: {s.label}</option>)}
        </select>
        <div className="flex gap-2">
          <textarea rows={2} className="input resize-none" placeholder="Escreva um comentário…" value={text} onChange={(e) => setText(e.target.value)} />
          <button className="btn-primary shrink-0 px-3" aria-label="Enviar comentário"><Send size={16} /></button>
        </div>
      </form>
    </aside>
  );
}
