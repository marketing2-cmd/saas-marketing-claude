"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, MessageSquareWarning } from "lucide-react";
import PostPreview, { Avatar } from "@/components/PostPreview";
import FeedGrid from "@/components/FeedGrid";
import StatusBadge from "@/components/StatusBadge";
import { FORMATS, formatDateTime } from "@/lib/posts";

export default function ClientPortal({ token, client, agency, initialPosts, initialComments }) {
  const [posts, setPosts] = useState(initialPosts);
  const [comments, setComments] = useState(initialComments);
  const [tab, setTab] = useState("review");
  const [name, setName] = useState("");

  useEffect(() => {
    try { setName(localStorage.getItem("portal_name") || ""); } catch {}
  }, []);
  function rememberName(v) {
    setName(v);
    try { localStorage.setItem("portal_name", v); } catch {}
  }

  const toReview = posts.filter((p) => p.status === "in_review");
  const others = posts.filter((p) => p.status !== "in_review");

  async function review(post, action, comment) {
    const res = await fetch(`/api/public/${token}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: post.id, action, comment, name }),
    });
    const json = await res.json();
    if (!res.ok) {
      alert(json.error || "Algo deu errado. Tente novamente.");
      return false;
    }
    setPosts((list) => list.map((p) => (p.id === post.id ? { ...p, status: json.status } : p)));
    if (json.comment) setComments((list) => [...list, json.comment]);
    return true;
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4">
          <Avatar client={client} size={40} />
          <div>
            <div className="font-bold">{client.name}</div>
            <div className="text-xs text-ink-mute">Aprovação de conteúdo{agency ? ` · ${agency}` : ""}</div>
          </div>
        </div>
        <div className="mx-auto flex max-w-3xl gap-1 px-4">
          {[["review", `Para aprovar (${toReview.length})`], ["feed", "Prévia do feed"], ["history", "Histórico"]].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`border-b-2 px-3 py-2 text-sm font-semibold ${tab === k ? "border-brand text-brand" : "border-transparent text-ink-soft"}`}>{l}</button>
          ))}
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
                  <ReviewCard key={p.id} post={p} client={client} comments={comments.filter((c) => c.post_id === p.id)} onReview={review} />
                ))}
              </div>
            )}
          </>
        )}

        {tab === "feed" && (
          <>
            <p className="mb-3 text-sm text-ink-soft">Assim o seu perfil vai ficar com os posts planejados.</p>
            <FeedGrid posts={posts} />
          </>
        )}

        {tab === "history" && (
          <div className="card divide-y divide-line">
            {others.length === 0 && <div className="p-6 text-sm text-ink-mute">Nada por aqui ainda.</div>}
            {others.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{p.title || p.caption?.slice(0, 60) || "Post"}</div>
                  <div className="text-xs text-ink-mute">{formatDateTime(p.published_at || p.scheduled_at)}</div>
                </div>
                <StatusBadge status={p.status} />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function ReviewCard({ post, client, comments, onReview }) {
  const [mode, setMode] = useState(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(action) {
    if (action === "request_changes" && !text.trim()) return;
    setBusy(true);
    const ok = await onReview(post, action, text.trim());
    setBusy(false);
    if (ok) { setText(""); setMode(null); }
  }

  return (
    <div className="card grid gap-5 p-4 sm:grid-cols-[280px_1fr]">
      <PostPreview client={client} post={post} />
      <div className="flex flex-col">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={post.status} />
          <span className="text-xs text-ink-mute">{FORMATS[post.format]} · {formatDateTime(post.scheduled_at)}</span>
        </div>
        {post.title && <h3 className="mt-2 font-bold">{post.title}</h3>}

        {comments.length > 0 && (
          <div className="mt-3 space-y-2">
            {comments.map((c) => (
              <div key={c.id} className={`rounded-lg px-3 py-2 text-sm ${c.author_type === "client" ? "bg-amber-50" : "bg-paper"}`}>
                <div className="text-xs font-semibold text-ink-soft">{c.author_type === "client" ? c.author_name || "Você" : "Equipe"}</div>
                <div className="whitespace-pre-wrap">{c.body}</div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-auto pt-4">
          {mode === "changes" ? (
            <div>
              <textarea className="input min-h-[90px]" autoFocus placeholder="O que precisa mudar?" value={text} onChange={(e) => setText(e.target.value)} />
              <div className="mt-2 flex gap-2">
                <button onClick={() => setMode(null)} className="btn-ghost" disabled={busy}>Cancelar</button>
                <button onClick={() => submit("request_changes")} className="btn bg-rose-600 text-white hover:bg-rose-700" disabled={busy || !text.trim()}>Enviar pedido de ajuste</button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button onClick={() => submit("approve")} className="btn bg-emerald-600 text-white hover:bg-emerald-700" disabled={busy}>
                <CheckCircle2 size={16} /> Aprovar
              </button>
              <button onClick={() => setMode("changes")} className="btn-ghost" disabled={busy}>
                <MessageSquareWarning size={16} /> Pedir ajuste
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
