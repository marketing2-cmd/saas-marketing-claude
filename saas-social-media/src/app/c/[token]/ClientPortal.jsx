"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, ExternalLink, ImageIcon, MessageSquareWarning, Send, X } from "lucide-react";
import PortalCalendar from "@/components/portal/PortalCalendar";
import { CompetitorsView, DiagnosisView, PersonasView, PositioningView, ProductsView, ScheduleView } from "@/components/portal/PortalSections";
import PostPreview, { Avatar } from "@/components/PostPreview";
import FeedGrid from "@/components/FeedGrid";
import StatusBadge from "@/components/StatusBadge";
import Logo from "@/components/Logo";
import ClientCover from "@/components/ClientCover";
import { FORMATS, STAGES, STAGE_STATUSES, derivePostStatus, formatDateTime, getStages, isStageEmpty, skipEmptyStages, stagesToJson } from "@/lib/posts";

export default function ClientPortal({ token, client, agency, initialPosts, initialComments, shared = {}, demo = false }) {
  const [posts, setPosts] = useState(initialPosts);
  const [comments, setComments] = useState(initialComments);
  const [tab, setTab] = useState("review");
  const [name, setName] = useState("");
  const [openPost, setOpenPost] = useState(null);

  useEffect(() => {
    try { setName(localStorage.getItem("portal_name") || ""); } catch {}
  }, []);
  function rememberName(v) {
    setName(v);
    try { localStorage.setItem("portal_name", v); } catch {}
  }

  const pending = (p) => Object.values(skipEmptyStages(p, getStages(p))).includes("in_review");
  const toReview = posts.filter(pending);
  const others = posts.filter((p) => !pending(p));

  // stage = null → todas as etapas "Em aprovação" do post
  async function review(post, action, comment, stage = null) {
    if (demo) {
      const stages = skipEmptyStages(post, getStages(post));
      const targets = stage ? [stage] : Object.keys(stages).filter((k) => stages[k] === "in_review");
      targets.forEach((k) => (stages[k] = action === "approve" ? "approved" : "changes_requested"));
      const status = derivePostStatus(post, stages);
      setPosts((list) => list.map((p) => (p.id === post.id ? { ...p, stages: stagesToJson(stages), status } : p)));
      if (comment) setComments((list) => [...list, { id: String(Math.random()), post_id: post.id, author_type: "client", author_name: name, body: comment, stage, created_at: new Date().toISOString() }]);
      return true;
    }
    const res = await fetch(`/api/public/${token}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: post.id, action, comment, name, stage }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(json.error || "Algo deu errado. Tente novamente.");
      return false;
    }
    setPosts((list) => list.map((p) => (p.id === post.id ? { ...p, ...json.post } : p)));
    if (json.comment) setComments((list) => [...list, json.comment]);
    return true;
  }

  // Mensagem livre para a equipe (sem aprovar/recusar)
  async function sendMessage(post, body, stage = null) {
    if (demo) {
      setComments((list) => [...list, { id: String(Math.random()), post_id: post.id, author_type: "client", author_name: name, body, stage, created_at: new Date().toISOString() }]);
      return true;
    }
    const res = await fetch(`/api/public/${token}/comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: post.id, body, name, stage }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(json.error || "Não foi possível enviar.");
      return false;
    }
    setComments((list) => [...list, json.comment]);
    return true;
  }

  const sectionTabs = [
    ["diagnosis", "Diagnóstico", shared.diagnosis],
    ["persona", "Persona", shared.personas],
    ["competitors", "Concorrência", shared.competitors],
    ["positioning", "Posicionamento", shared.positioning],
    ["products", "Produtos", shared.products],
    ["schedule", "Cronograma", shared.schedule],
  ].filter(([, , v]) => v !== undefined);
  const livePost = openPost ? posts.find((p) => p.id === openPost) : null;

  return (
    <div className="min-h-screen">
      {demo && (
        <div className="bg-navy px-4 py-2 text-center text-xs text-white">
          <b>Demonstração</b> — é isto que o seu cliente vê ao abrir o link de aprovação.
        </div>
      )}
      <header className="border-b border-line bg-white">
        <ClientCover client={client} className="h-28 sm:h-40" />
        <div className="mx-auto max-w-3xl px-4">
          <div className="relative -mt-9 flex items-end gap-3">
            <div className="rounded-full bg-white p-1 shadow-soft"><Avatar client={client} size={68} /></div>
            <div className="pb-1">
              <div className="text-lg font-bold">{client.name}</div>
              <div className="text-xs text-ink-mute">Aprovação de conteúdo{agency ? ` · ${agency}` : ""}</div>
            </div>
          </div>
          <div className="mt-4 flex gap-1 overflow-x-auto">
            {[["review", "Para aprovar", toReview.length], ["calendar", "Calendário"], ["feed", "Prévia do feed"], ["history", "Histórico"], ...sectionTabs.map(([k, l]) => [k, l])].map(([k, l, n]) => (
              <button key={k} onClick={() => setTab(k)} className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-semibold ${tab === k ? "border-brand text-brand" : "border-transparent text-ink-soft"}`}>
                {l}
                {n > 0 && <span className="rounded-full bg-amber-100 px-1.5 text-[11px] font-bold text-amber-700">{n}</span>}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        {tab === "review" && (
          <>
            <div className="mb-4">
              <label className="label">Seu nome (aparece nos comentários)</label>
              <input className="input max-w-xs" value={name} onChange={(e) => rememberName(e.target.value)} placeholder="Ex.: Ana" />
            </div>
            {toReview.length === 0 ? (
              <div className="card p-10 text-center">
                <CheckCircle2 className="mx-auto text-emerald-500" size={36} />
                <p className="mt-3 font-semibold">Tudo aprovado por aqui!</p>
                <p className="text-sm text-ink-soft">Quando houver novos posts, eles aparecem nesta página.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {toReview.map((p) => (
                  <ReviewCard key={p.id} post={p} client={client} comments={comments.filter((c) => c.post_id === p.id)} onReview={review} onMessage={sendMessage} />
                ))}
              </div>
            )}
          </>
        )}

        {tab === "calendar" && <PortalCalendar posts={posts} onOpen={(p) => setOpenPost(p.id)} />}

        {tab === "diagnosis" && shared.diagnosis && <DiagnosisView data={shared.diagnosis} />}
        {tab === "persona" && shared.personas && <PersonasView items={shared.personas} />}
        {tab === "competitors" && shared.competitors && <CompetitorsView items={shared.competitors} />}
        {tab === "positioning" && shared.positioning && <PositioningView data={shared.positioning} />}
        {tab === "products" && shared.products && <ProductsView items={shared.products} />}
        {tab === "schedule" && shared.schedule && <ScheduleView data={shared.schedule} />}

        {tab === "feed" && (
          <>
            <p className="mb-3 text-sm text-ink-soft">Assim o seu perfil vai ficar com os posts planejados.</p>
            <div className="mx-auto max-w-[560px]"><FeedGrid posts={posts.filter((p) => p.media?.length)} onOpen={(p) => setOpenPost(p.id)} /></div>
          </>
        )}

        {tab === "history" && (
          <div className="card divide-y divide-line">
            {others.length === 0 && <div className="p-6 text-sm text-ink-mute">Nada por aqui ainda.</div>}
            {others.map((p) => (
              <button key={p.id} onClick={() => setOpenPost(p.id)} className="flex w-full items-center justify-between gap-3 p-3 text-left hover:bg-paper">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{p.title || p.caption?.slice(0, 60) || "Post"}</div>
                  <div className="text-xs text-ink-mute">{formatDateTime(p.published_at || p.scheduled_at)}</div>
                </div>
                <StatusBadge status={p.status} />
              </button>
            ))}
          </div>
        )}
      </main>
      <footer className="flex justify-center pb-10 pt-4 opacity-70"><Logo /></footer>

      {livePost && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-navy/50 p-3 sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && setOpenPost(null)}>
          <div className="relative mx-auto max-w-3xl">
            <button onClick={() => setOpenPost(null)} className="absolute -top-1 right-0 z-10 rounded-full bg-white p-2 shadow-float sm:-right-3 sm:-top-3" aria-label="Fechar"><X size={18} /></button>
            <ReviewCard post={livePost} client={client} comments={comments.filter((c) => c.post_id === livePost.id)} onReview={review} onMessage={sendMessage} />
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewCard({ post, client, comments, onReview, onMessage }) {
  const stages = skipEmptyStages(post, getStages(post));
  const inReview = STAGES.filter((s) => stages[s.key] === "in_review");
  const [busyAll, setBusyAll] = useState(false);
  const generalComments = comments.filter((c) => !c.stage);

  async function approveAll() {
    setBusyAll(true);
    await onReview(post, "approve", "", null);
    setBusyAll(false);
  }

  return (
    <article className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <div className="truncate font-bold">{post.title || post.theme?.split("\n")[0] || "Conteúdo"}</div>
          <div className="text-xs text-ink-mute">{FORMATS[post.format]} · {formatDateTime(post.scheduled_at)}</div>
        </div>
        {inReview.length > 1 && (
          <button onClick={approveAll} disabled={busyAll} className="btn bg-emerald-600 px-3 py-2 text-xs text-white hover:bg-emerald-700">
            <CheckCircle2 size={15} /> Aprovar tudo ({inReview.length})
          </button>
        )}
      </div>

      <div className="grid items-start gap-5 p-4 sm:grid-cols-[280px_1fr] sm:p-5">
        <div className="sm:sticky sm:top-4">
          {post.media?.length ? (
            <PostPreview client={client} post={post} />
          ) : (
            <div className="flex aspect-[4/5] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-paper p-4 text-center text-ink-mute">
              <ImageIcon size={26} />
              <span className="text-xs font-medium">A arte ainda está em produção</span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {STAGES.filter((s) => stages[s.key] === "draft" || !isStageEmpty(post, s.key)).map((s) => (
            <StageBlock key={s.key} stage={s} status={stages[s.key]} post={post} comments={comments.filter((c) => c.stage === s.key)} onReview={onReview} />
          ))}
          {generalComments.length > 0 && (
            <div className="space-y-2 pt-1">
              {generalComments.map((c) => <CommentBubble key={c.id} c={c} />)}
            </div>
          )}
          {onMessage && <MessageBox onSend={(text) => onMessage(post, text)} />}
        </div>
      </div>
    </article>
  );
}

function MessageBox({ onSend }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    const ok = await onSend(text.trim());
    setBusy(false);
    if (ok) setText("");
  }
  return (
    <form onSubmit={submit} className="rounded-2xl border border-line bg-paper/60 p-3">
      <label className="label">Mensagem para a equipe</label>
      <div className="flex gap-2">
        <textarea rows={2} className="input resize-none bg-white" placeholder="Dúvida, sugestão ou recado sobre este conteúdo…" value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn-primary shrink-0 px-3" disabled={busy || !text.trim()} aria-label="Enviar mensagem"><Send size={16} /></button>
      </div>
    </form>
  );
}

function CommentBubble({ c }) {
  return (
    <div className={`rounded-lg px-3 py-2 text-sm ${c.author_type === "client" ? "bg-amber-50" : "bg-paper"}`}>
      <div className="text-xs font-semibold text-ink-soft">{c.author_type === "client" ? c.author_name || "Você" : "Equipe"}</div>
      <div className="whitespace-pre-wrap">{c.body}</div>
    </div>
  );
}

// Uma etapa no portal: rascunho aparece só como "em produção", sem conteúdo
function StageBlock({ stage, status, post, comments, onReview }) {
  const [mode, setMode] = useState(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const meta = STAGE_STATUSES[status];

  if (status === "draft") {
    return (
      <div className="flex items-center justify-between rounded-2xl border border-dashed border-line px-4 py-3 text-sm text-ink-mute">
        <span className="font-semibold">{stage.label}</span>
        <span className="flex items-center gap-1 text-xs"><Clock size={13} /> Em produção</span>
      </div>
    );
  }

  async function submit(action) {
    if (action === "request_changes" && !text.trim()) return;
    setBusy(true);
    const ok = await onReview(post, action, text.trim(), stage.key);
    setBusy(false);
    if (ok) {
      setText("");
      setMode(null);
    }
  }

  const content =
    stage.key === "theme" ? (
      <>
        {post.theme ? <p className="whitespace-pre-wrap text-sm">{post.theme}</p> : <p className="text-sm text-ink-mute">Sem descrição.</p>}
        {post.reference_links?.length > 0 && (
          <div className="mt-2 space-y-1">
            {post.reference_links.map((l, i) => (
              <a key={i} href={l} target="_blank" rel="noreferrer" className="flex items-center gap-1 truncate text-xs font-semibold text-brand hover:underline">
                <ExternalLink size={12} /> Referência {i + 1}
              </a>
            ))}
          </div>
        )}
      </>
    ) : stage.key === "content" ? (
      post.content_text ? <p className="whitespace-pre-wrap text-sm">{post.content_text}</p> : <p className="text-sm text-ink-mute">Sem texto.</p>
    ) : stage.key === "media" ? (
      <p className="text-sm text-ink-soft">{post.media?.length ? `${post.media.length} ${post.media.length === 1 ? "arquivo" : "arquivos"} — veja na prévia${post.media.length > 1 ? " (deslize para ver todos)" : ""}.` : "Nenhum arquivo."}</p>
    ) : post.caption ? (
      <p className="whitespace-pre-wrap text-sm">{post.caption}</p>
    ) : (
      <p className="text-sm text-ink-mute">Sem legenda.</p>
    );

  return (
    <section className={`rounded-2xl border p-4 ${status === "in_review" ? "border-amber-200 bg-amber-50/40" : "border-line"}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h4 className="font-bold">{stage.label}</h4>
        <span className={`chip ${meta.color}`}><span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />{meta.label}</span>
      </div>
      {content}
      {comments.length > 0 && <div className="mt-3 space-y-2">{comments.map((c) => <CommentBubble key={c.id} c={c} />)}</div>}

      {status === "in_review" && (
        <div className="mt-3">
          {mode === "changes" ? (
            <div>
              <textarea className="input min-h-[80px] bg-white" autoFocus placeholder={`O que precisa mudar em "${stage.label}"?`} value={text} onChange={(e) => setText(e.target.value)} />
              <div className="mt-2 flex gap-2">
                <button onClick={() => setMode(null)} className="btn-ghost px-3 py-2 text-xs" disabled={busy}>Cancelar</button>
                <button onClick={() => submit("request_changes")} className="btn bg-rose-600 px-3 py-2 text-xs text-white hover:bg-rose-700" disabled={busy || !text.trim()}>Enviar ajuste</button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button onClick={() => submit("approve")} className="btn bg-emerald-600 px-3 py-2 text-xs text-white hover:bg-emerald-700" disabled={busy}>
                <CheckCircle2 size={15} /> Aprovar {stage.label.toLowerCase()}
              </button>
              <button onClick={() => setMode("changes")} className="btn-ghost px-3 py-2 text-xs" disabled={busy}>
                <MessageSquareWarning size={15} /> Pedir ajuste
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
