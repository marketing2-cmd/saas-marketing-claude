// Metadados compartilhados entre painel e portal do cliente

export const STATUSES = {
  draft: { label: "Rascunho", color: "bg-slate-100 text-slate-600", dot: "bg-slate-400", accent: "#94A3B8", soft: "#F1F5F9" },
  in_review: { label: "Em aprovação", color: "bg-amber-100 text-amber-700", dot: "bg-amber-400", accent: "#F5A524", soft: "#FFF5DC" },
  changes_requested: { label: "Ajuste", color: "bg-coral-soft text-coral-dark", dot: "bg-coral", accent: "#E8452B", soft: "#FFE4DE" },
  approved: { label: "Aprovado", color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500", accent: "#22B07D", soft: "#E1F7EE" },
  scheduled: { label: "Agendado", color: "bg-brand-soft text-brand", dot: "bg-brand-light", accent: "#1E4FD8", soft: "#E7ECFA" },
  publishing: { label: "Publicando", color: "bg-sky-100 text-sky-700", dot: "bg-sky-400", accent: "#38BDF8", soft: "#E0F4FE" },
  published: { label: "Publicado", color: "bg-sky-100 text-sky-700", dot: "bg-sky-500", accent: "#0EA5E9", soft: "#E0F4FE" },
  failed: { label: "Falhou", color: "bg-red-100 text-red-700", dot: "bg-red-600", accent: "#DC2626", soft: "#FEE2E2" },
};

export const BOARD_COLUMNS = ["draft", "in_review", "changes_requested", "approved", "scheduled", "published"];

export const FORMATS = {
  feed: "Estático",
  carousel: "Carrossel",
  reels: "Reels",
  story: "Story",
};

// Status que um post aprovado deve assumir: com data → agendado
export function statusAfterApproval(post) {
  return post.scheduled_at ? "scheduled" : "approved";
}

export function formatDateTime(value) {
  if (!value) return "Sem data";
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// <input type="datetime-local"> trabalha no fuso local, sem "Z"
export function toLocalInput(value) {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromLocalInput(value) {
  return value ? new Date(value).toISOString() : null;
}

export function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// Degradê pastel do banner do cliente, a partir da cor dele
export function clientGradient(color = "#082B87") {
  return `linear-gradient(120deg, ${color}26 0%, ${color}66 55%, ${color}b3 100%)`;
}

// ── Etapas de produção/aprovação de um post ─────────────────
export const STAGES = [
  { key: "theme", label: "Tema" },
  { key: "content", label: "Conteúdo" },
  { key: "media", label: "Mídia" },
  { key: "caption", label: "Legenda" },
];

export const STAGE_STATUSES = {
  draft: { label: "Rascunho", color: "bg-slate-100 text-slate-600", dot: "bg-slate-400" },
  in_review: { label: "Em aprovação", color: "bg-amber-100 text-amber-700", dot: "bg-amber-400" },
  changes_requested: { label: "Ajuste", color: "bg-rose-100 text-rose-600", dot: "bg-rose-500" },
  approved: { label: "Aprovada", color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
};

// Status de cada etapa. Posts antigos (sem etapas) herdam o status do post.
export function getStages(post) {
  const fallback =
    ["approved", "scheduled", "publishing", "published", "failed"].includes(post.status) ? "approved"
    : post.status === "in_review" ? "in_review"
    : post.status === "changes_requested" ? "changes_requested"
    : "draft";
  const stored = post.stages || {};
  return Object.fromEntries(STAGES.map(({ key }) => [key, stored[key]?.status || fallback]));
}

// Responsável de cada etapa (user_id ou null)
export function getAssignees(post) {
  const stored = post?.stages || {};
  return Object.fromEntries(STAGES.map(({ key }) => [key, stored[key]?.assignee || null]));
}

export function stagesToJson(stages, assignees = {}) {
  return Object.fromEntries(
    Object.entries(stages).map(([k, v]) => [k, assignees[k] ? { status: v, assignee: assignees[k] } : { status: v }])
  );
}

// Onde o post está parado: primeira etapa com trabalho a fazer (rascunho/ajuste);
// se só falta o cliente → "review"; tudo aprovado → "done"
export function currentStage(post) {
  if (["published", "publishing"].includes(post.status)) return "published";
  const stages = getStages(post);
  const work = STAGES.find(({ key }) => stages[key] === "draft" || stages[key] === "changes_requested");
  if (work) return work.key;
  if (STAGES.some(({ key }) => stages[key] === "in_review")) return "review";
  return "done";
}

// Status geral do post a partir das etapas
export function derivePostStatus(post, stages) {
  if (["publishing", "published"].includes(post.status)) return post.status;
  const values = Object.values(stages);
  if (values.some((v) => v === "changes_requested")) return "changes_requested";
  if (values.some((v) => v === "in_review")) return "in_review";
  if (values.every((v) => v === "approved")) return post.scheduled_at ? "scheduled" : "approved";
  return "draft";
}

// Etapas que o cliente pode ver no portal (rascunho fica escondido)
export const CLIENT_VISIBLE_STAGE = new Set(["in_review", "approved", "changes_requested"]);

// Remove do post tudo o que pertence a etapas em rascunho (nunca enviar ao cliente)
export function sanitizeForClient(post) {
  const stages = getStages(post);
  const show = (k) => CLIENT_VISIBLE_STAGE.has(stages[k]);
  return {
    id: post.id,
    title: post.title,
    format: post.format,
    status: post.status,
    scheduled_at: post.scheduled_at,
    published_at: post.published_at,
    stages: stagesToJson(stages),
    theme: show("theme") ? post.theme : "",
    reference_links: show("theme") ? post.reference_links || [] : [],
    content_text: show("content") ? post.content_text : "",
    media: show("media") ? post.media || [] : [],
    caption: show("caption") ? post.caption : "",
  };
}

// Etapa sem nada preenchido: não há o que aprovar
export function isStageEmpty(post, key) {
  if (key === "theme") return !(post.theme || "").trim() && !(post.reference_links || []).filter(Boolean).length;
  if (key === "content") return !(post.content_text || "").trim();
  if (key === "media") return !(post.media || []).length;
  if (key === "caption") return !(post.caption || "").trim();
  return false;
}

// Etapas vazias que estão "Em aprovação" contam como aprovadas
export function skipEmptyStages(post, stages) {
  const out = { ...stages };
  for (const k of Object.keys(out)) if (out[k] === "in_review" && isStageEmpty(post, k)) out[k] = "approved";
  return out;
}
