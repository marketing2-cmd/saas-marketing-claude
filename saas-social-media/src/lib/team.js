// Equipe: funções, responsável por etapa e prazos

export const FUNCTIONS = {
  strategy: "Estratégia / Social media",
  copy: "Copy",
  design: "Design",
  video: "Vídeo",
  management: "Gestão",
};

// Funções sugeridas para cada etapa (usadas para ordenar a lista de responsáveis)
export const STAGE_FUNCTIONS = {
  theme: ["strategy", "management"],
  content: ["copy"],
  media: ["design", "video"],
  caption: ["copy"],
};

export const DEFAULT_DEADLINES = { theme: 10, content: 7, media: 5, caption: 3 };

export function memberName(m) {
  if (!m) return "";
  return m.full_name?.trim() || m.email?.split("@")[0] || "Membro";
}

export function memberInitials(m) {
  return memberName(m).split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

const AVATAR_COLORS = ["#7C5CFC", "#F2557A", "#F5A524", "#22B07D", "#3B82F6", "#E879F9", "#14B8A6"];
export function memberColor(m) {
  const key = m?.user_id || m?.email || "";
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

// Membros ordenados: primeiro quem tem a função sugerida para a etapa
export function membersForStage(members, stage) {
  const pref = STAGE_FUNCTIONS[stage] || [];
  return [...members].sort((a, b) => {
    const pa = (a.functions || []).some((f) => pref.includes(f)) ? 0 : 1;
    const pb = (b.functions || []).some((f) => pref.includes(f)) ? 0 : 1;
    return pa - pb || memberName(a).localeCompare(memberName(b));
  });
}

// Prazo da etapa: X dias antes da publicação (null se o post não tem data)
export function stageDue(post, stage, deadlines = DEFAULT_DEADLINES) {
  if (!post.scheduled_at) return null;
  const days = Number(deadlines?.[stage] ?? DEFAULT_DEADLINES[stage]) || 0;
  const d = new Date(post.scheduled_at);
  d.setDate(d.getDate() - days);
  return d;
}
