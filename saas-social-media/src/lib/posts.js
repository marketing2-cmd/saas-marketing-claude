// Metadados compartilhados entre painel e portal do cliente

export const STATUSES = {
  draft: { label: "Rascunho", color: "bg-slate-100 text-slate-600", dot: "bg-slate-400", accent: "#94A3B8", soft: "#F1F5F9" },
  in_review: { label: "Em aprovação", color: "bg-amber-100 text-amber-700", dot: "bg-amber-400", accent: "#F5A524", soft: "#FFF5DC" },
  changes_requested: { label: "Ajuste", color: "bg-rose-100 text-rose-600", dot: "bg-rose-500", accent: "#F2557A", soft: "#FFE6EC" },
  approved: { label: "Aprovado", color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500", accent: "#22B07D", soft: "#E1F7EE" },
  scheduled: { label: "Agendado", color: "bg-brand-soft text-brand", dot: "bg-brand", accent: "#7C5CFC", soft: "#F1EDFF" },
  publishing: { label: "Publicando", color: "bg-sky-100 text-sky-700", dot: "bg-sky-400", accent: "#38BDF8", soft: "#E0F4FE" },
  published: { label: "Publicado", color: "bg-sky-100 text-sky-700", dot: "bg-sky-500", accent: "#0EA5E9", soft: "#E0F4FE" },
  failed: { label: "Falhou", color: "bg-red-100 text-red-700", dot: "bg-red-600", accent: "#DC2626", soft: "#FEE2E2" },
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

// Degradê pastel do banner do cliente, a partir da cor dele
export function clientGradient(color = "#7C5CFC") {
  return `linear-gradient(120deg, ${color}26 0%, ${color}66 55%, ${color}b3 100%)`;
}
