// Utilitários dos relatórios do Instagram (servidor e navegador)

export const MAX_RANGE_DAYS = 90;
const DAY = 86400;

// Cartões de métricas, na ordem em que aparecem
export const METRICS = [
  { key: "reach", label: "Alcance", help: "Contas únicas que viram seu conteúdo." },
  { key: "views", label: "Visualizações", help: "Quantas vezes o conteúdo foi exibido." },
  { key: "total_interactions", label: "Interações", help: "Curtidas, comentários, salvamentos, compartilhamentos e respostas." },
  { key: "accounts_engaged", label: "Contas com engajamento", help: "Contas únicas que interagiram com o conteúdo." },
  { key: "likes", label: "Curtidas" },
  { key: "comments", label: "Comentários" },
  { key: "shares", label: "Compartilhamentos" },
  { key: "saves", label: "Salvamentos" },
  { key: "profile_views", label: "Visitas ao perfil" },
  { key: "profile_links_taps", label: "Cliques nos links do perfil" },
  { key: "follows", label: "Novos seguidores" },
];

export const PRESETS = [
  { days: 7, label: "7 dias" },
  { days: 14, label: "14 dias" },
  { days: 30, label: "30 dias" },
  { days: 90, label: "90 dias" },
];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isoDay(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Últimos N dias terminando ontem (o dia de hoje ainda está incompleto)
export function presetRange(days) {
  const until = new Date();
  until.setDate(until.getDate() - 1);
  const since = new Date(until);
  since.setDate(since.getDate() - (days - 1));
  return { since: isoDay(since), until: isoDay(until) };
}

// Valida "YYYY-MM-DD" (until inclusivo) → timestamps UTC em segundos, until exclusivo
export function parseRange(sinceStr, untilStr) {
  if (!DATE_RE.test(sinceStr || "") || !DATE_RE.test(untilStr || "")) return null;
  const since = Date.parse(`${sinceStr}T00:00:00Z`) / 1000;
  const until = Date.parse(`${untilStr}T00:00:00Z`) / 1000 + DAY;
  if (!Number.isFinite(since) || !Number.isFinite(until) || until <= since) return null;
  const days = Math.round((until - since) / DAY);
  if (days > MAX_RANGE_DAYS) return null;
  const tomorrow = Date.now() / 1000 + DAY;
  if (until > tomorrow) return null;
  if (since < Date.now() / 1000 - 2 * 365 * DAY) return null;
  return { since, until, days, sinceDate: sinceStr, untilDate: untilStr };
}

const compactFmt = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });
const fullFmt = new Intl.NumberFormat("pt-BR");

export function formatNumber(n, { compact = true } = {}) {
  if (n === null || n === undefined) return "—";
  return compact && Math.abs(n) >= 10000 ? compactFmt.format(n) : fullFmt.format(n);
}

export function formatPercent(n) {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return `${n.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

// Variação % vs período anterior (null quando não dá para comparar)
export function delta(value, previous) {
  if (value === null || value === undefined || previous === null || previous === undefined || previous === 0) return null;
  return ((value - previous) / previous) * 100;
}

export function shortDate(iso) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
}

// ── Dados fictícios para /demo ────────────────────────────────

function seeded(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

export function buildDemoReport(clientId, sinceStr, untilStr) {
  const range = parseRange(sinceStr, untilStr) || parseRange(presetRange(30).since, presetRange(30).until);
  const rand = seeded([...clientId].reduce((a, c) => a + c.charCodeAt(0), 0) * 7919 + range.days);
  const base = 1800 + rand() * 2200;

  const reach = [];
  for (let i = 0; i < range.days; i++) {
    const d = new Date((range.since + i * DAY) * 1000);
    const weekday = d.getUTCDay();
    const weekend = weekday === 0 || weekday === 6 ? 0.78 : 1;
    const growth = 1 + i / (range.days * 3);
    const spike = rand() > 0.9 ? 1.9 + rand() : 1;
    reach.push({ date: d.toISOString().slice(0, 10), value: Math.round(base * weekend * growth * spike * (0.85 + rand() * 0.3)) });
  }
  const sum = reach.reduce((a, p) => a + p.value, 0);
  const pick = (k, f) => Math.round(sum * f * (0.85 + rand() * 0.3));
  const withPrev = (v) => ({ value: v, previous: Math.round(v * (0.75 + rand() * 0.4)) });

  const likes = pick("likes", 0.045);
  const comments = pick("comments", 0.004);
  const shares = pick("shares", 0.006);
  const saves = pick("saves", 0.009);
  const totals = {
    reach: withPrev(Math.round(sum * 0.62)),
    views: withPrev(Math.round(sum * 2.4)),
    likes: withPrev(likes),
    comments: withPrev(comments),
    shares: withPrev(shares),
    saves: withPrev(saves),
    total_interactions: withPrev(likes + comments + shares + saves),
    accounts_engaged: withPrev(Math.round((likes + comments) * 0.7)),
    profile_views: withPrev(pick("pv", 0.03)),
    profile_links_taps: withPrev(pick("lt", 0.003)),
    follows: withPrev(pick("f", 0.004)),
    unfollows: withPrev(pick("u", 0.0012)),
  };

  const types = ["image", "carousel", "reels", "image", "reels", "carousel"];
  const captions = [
    "Lançamento da semana ✨ Já garantiu o seu?",
    "Bastidores de como tudo é feito com carinho 💜",
    "3 dicas que ninguém te conta 👇",
    "Depoimento de quem já testou e aprovou",
    "Promoção relâmpago só até domingo!",
    "Conheça a equipe por trás de tudo",
    "Antes e depois que vai te surpreender",
    "Perguntas frequentes respondidas",
  ];
  const nPosts = Math.max(3, Math.round(range.days / 2.5));
  const posts = Array.from({ length: Math.min(nPosts, 24) }, (_, i) => {
    const r = Math.round(base * (0.6 + rand() * 1.8));
    const l = Math.round(r * (0.04 + rand() * 0.06));
    const c = Math.round(l * (0.05 + rand() * 0.1));
    const sv = Math.round(l * (0.1 + rand() * 0.25));
    const sh = Math.round(l * (0.05 + rand() * 0.2));
    const ts = new Date((range.until - (i + 0.4) * ((range.until - range.since) / nPosts)) * 1000);
    return {
      id: `demo-${i}`,
      caption: captions[i % captions.length],
      type: types[i % types.length],
      thumb: `/demo/p${(i % 12) + 1}.jpg`,
      permalink: null,
      timestamp: ts.toISOString(),
      likes: l,
      comments: c,
      reach: r,
      saves: sv,
      shares: sh,
      views: Math.round(r * (1.3 + rand())),
      interactions: l + c + sv + sh,
    };
  });

  return {
    account: { username: null, followers: Math.round(4000 + rand() * 20000), following: Math.round(300 + rand() * 900), mediaCount: Math.round(200 + rand() * 600) },
    totals,
    unavailable: [],
    series: { reach },
    posts,
    range: { since: range.sinceDate, until: range.untilDate, days: range.days },
  };
}
