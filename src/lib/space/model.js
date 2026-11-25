// Constantes e regras de negócio do SpaceMais (sem React).

export const STATUSES = [
  { id: "todo", label: "A fazer", color: "#6E6E68" },
  { id: "doing", label: "Em andamento", color: "#F2A100" },
  { id: "review", label: "Em revisão", color: "#7B3FF2" },
  { id: "done", label: "Concluído", color: "#00A86B" },
];

export const PRIORITIES = [
  { id: "low", label: "Baixa", color: "#8EC5FF" },
  { id: "medium", label: "Média", color: "#579BFC" },
  { id: "high", label: "Alta", color: "#FF9F1A" },
  { id: "urgent", label: "Urgente", color: "#E23744" },
];

export const FREQUENCIES = [
  { id: "daily", label: "Diária", hint: "todo dia útil" },
  { id: "weekly", label: "Semanal", hint: "uma vez por semana" },
  { id: "monthly", label: "Mensal", hint: "uma vez por mês" },
];

export const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export const PALETTE = ["#FF6A00", "#0A84FF", "#00A86B", "#F2B300", "#8B5CF6", "#E23744", "#00A3BF", "#FF6B9D"];

export const statusOf = (id) => STATUSES.find((s) => s.id === id) || STATUSES[0];
export const priorityOf = (id) => PRIORITIES.find((p) => p.id === id) || PRIORITIES[1];

// ---- datas (sempre no fuso local, nunca UTC) -------------------------------
const pad = (n) => String(n).padStart(2, "0");

export function toISODate(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseISODate(s) {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function daysFromToday(iso) {
  const d = parseISODate(iso);
  if (!d) return null;
  const t = parseISODate(toISODate());
  return Math.round((d - t) / 86400000);
}

export function formatDue(iso) {
  if (!iso) return "";
  const diff = daysFromToday(iso);
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Amanhã";
  if (diff === -1) return "Ontem";
  const d = parseISODate(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
}

export function formatLongDate(iso) {
  const d = parseISODate(iso);
  if (!d) return "";
  return capitalize(d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }));
}

export function capitalize(s = "") {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatTime(ts) {
  return new Date(ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function isOverdue(task) {
  return task.due_date && task.status !== "done" && daysFromToday(task.due_date) < 0;
}

// ---- rotinas ----------------------------------------------------------------
function isoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${pad(week)}`;
}

// Chave do período atual de uma rotina — um check por período.
export function periodKey(routine, date = new Date()) {
  if (routine.frequency === "weekly") return isoWeek(date);
  if (routine.frequency === "monthly") return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
  return toISODate(date);
}

export function checkId(routine, date = new Date()) {
  return `${routine.id}:${periodKey(routine, date)}`;
}

// A rotina aparece em "Meu dia" hoje?
//  diária  → dias úteis
//  semanal → no dia da semana escolhido (ou depois, se ainda não foi feita)
//  mensal  → a partir do dia do mês escolhido (ou sempre, se não tiver dia)
export function routineDueToday(routine, date = new Date()) {
  if (!routine.active) return false;
  const wd = date.getDay();
  if (routine.frequency === "daily") return wd !== 0 && wd !== 6;
  if (routine.frequency === "weekly") {
    const target = routine.weekday ?? 1;
    const isoToday = wd === 0 ? 7 : wd;
    const isoTarget = target === 0 ? 7 : target;
    return isoToday >= isoTarget;
  }
  if (routine.frequency === "monthly") return date.getDate() >= (routine.month_day || 1);
  return false;
}

export function routineWhen(routine) {
  if (routine.frequency === "weekly") return `Toda ${WEEKDAYS[routine.weekday ?? 1].toLowerCase()}`;
  if (routine.frequency === "monthly") return `Todo dia ${routine.month_day || 1}`;
  return "Todo dia útil";
}

export function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function colorFor(id = "") {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
