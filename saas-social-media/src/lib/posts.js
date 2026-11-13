// Metadados compartilhados entre painel e portal do cliente

export const STATUSES = {
  draft: { label: "Rascunho", color: "bg-slate-100 text-slate-700", dot: "bg-slate-400" },
  in_review: { label: "Em aprovação", color: "bg-amber-100 text-amber-800", dot: "bg-amber-500" },
  changes_requested: { label: "Ajuste pedido", color: "bg-rose-100 text-rose-700", dot: "bg-rose-500" },
  approved: { label: "Aprovado", color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  scheduled: { label: "Agendado", color: "bg-sky-100 text-sky-700", dot: "bg-sky-500" },
  publishing: { label: "Publicando", color: "bg-sky-100 text-sky-700", dot: "bg-sky-400" },
  published: { label: "Publicado", color: "bg-violet-100 text-violet-700", dot: "bg-violet-500" },
  failed: { label: "Falhou", color: "bg-red-100 text-red-700", dot: "bg-red-600" },
};

export const BOARD_COLUMNS = ["draft", "in_review", "changes_requested", "approved", "scheduled", "published"];

export const FORMATS = {
  feed: "Post (feed)",
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
