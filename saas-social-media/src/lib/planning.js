// Planejamento por cliente: linha editorial, cronograma e ideias

export const WEEKDAYS = [
  { n: 1, short: "Seg", long: "Segunda" },
  { n: 2, short: "Ter", long: "Terça" },
  { n: 3, short: "Qua", long: "Quarta" },
  { n: 4, short: "Qui", long: "Quinta" },
  { n: 5, short: "Sex", long: "Sexta" },
  { n: 6, short: "Sáb", long: "Sábado" },
  { n: 0, short: "Dom", long: "Domingo" },
];

export const PILLAR_COLORS = ["#1E4FD8", "#FF573C", "#F5A524", "#22B07D", "#8B5CF6", "#E879F9", "#14B8A6", "#64748B"];

export const NOTE_KINDS = {
  idea: { label: "Ideia", color: "bg-brand-soft text-brand" },
  insight: { label: "Insight", color: "bg-amber-100 text-amber-700" },
  reference: { label: "Referência", color: "bg-sky-100 text-sky-700" },
};

export const NOTE_STATUSES = {
  new: { label: "Nova", color: "bg-slate-100 text-slate-600" },
  approved: { label: "Aprovada", color: "bg-emerald-100 text-emerald-700" },
  used: { label: "Usada", color: "bg-sky-100 text-sky-700" },
  discarded: { label: "Descartada", color: "bg-rose-100 text-rose-600" },
};

export const uid = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2));

export function emptyStrategy() {
  return {
    goals: "",
    audience: "",
    tone: "",
    dos: "",
    donts: "",
    pillars: [],
    weekly_schedule: [],
    value_proposition: "",
    differentials: "",
    diagnosis: { summary: "", current_situation: "", strengths: "", weaknesses: "", opportunities: "", threats: "" },
    personas: [],
    competitors: [],
    products: [],
    section_visibility: {},
  };
}

// Seções do planejamento que podem ser liberadas para o cliente
export const SHAREABLE_SECTIONS = {
  diagnosis: "Diagnóstico",
  persona: "Persona",
  competitors: "Concorrência",
  positioning: "Posicionamento",
  products: "Produtos",
  schedule: "Cronograma",
};

export function emptyMonthlyPlan() {
  return { theme: "", goals: "", weeks: ["", "", "", "", ""], key_dates: [] };
}

// "2026-11" → "2026-11-01"
export function monthStart(date = new Date()) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export function shiftMonth(iso, delta) {
  const [y, m] = iso.split("-").map(Number);
  return monthStart(new Date(y, m - 1 + delta, 1));
}

export function monthLabel(iso) {
  const [y, m] = iso.split("-").map(Number);
  const s = new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Semanas do mês (para o foco semanal): 4 ou 5 blocos de 7 dias
export function weeksInMonth(iso) {
  const [y, m] = iso.split("-").map(Number);
  const days = new Date(y, m, 0).getDate();
  return Math.ceil(days / 7);
}

// Datas em que o cronograma semanal cai dentro do mês (só do momento atual em diante)
export function scheduleOccurrences(schedule, iso) {
  const [y, m] = iso.split("-").map(Number);
  const days = new Date(y, m, 0).getDate();
  const now = Date.now();
  const out = [];
  for (let d = 1; d <= days; d++) {
    const date = new Date(y, m - 1, d);
    for (const slot of schedule) {
      if (slot.weekday !== date.getDay()) continue;
      const [hh, mm] = (slot.time || "10:00").split(":").map(Number);
      const when = new Date(y, m - 1, d, hh || 0, mm || 0);
      if (when.getTime() > now) out.push({ slot, when });
    }
  }
  return out.sort((a, b) => a.when - b.when);
}

export function sortSlots(list) {
  return [...list].sort((a, b) => (a.time || "").localeCompare(b.time || ""));
}

// Exemplo para o modo demonstração
export function demoPlanning() {
  const pillars = [
    { id: "pl1", name: "Produto", description: "Lançamentos, cardápio e destaques da semana.", color: "#F2557A", share: 40 },
    { id: "pl2", name: "Bastidores", description: "Como é feito, equipe e rotina da cozinha.", color: "#7C5CFC", share: 25 },
    { id: "pl3", name: "Prova social", description: "Depoimentos, clientes e marcações.", color: "#22B07D", share: 20 },
    { id: "pl4", name: "Relacionamento", description: "Enquetes, perguntas e datas especiais.", color: "#F5A524", share: 15 },
  ];
  return {
    strategy: {
      goals: "Aumentar pedidos pelo direct e fortalecer a marca no bairro.",
      audience: "Mulheres de 25 a 45 anos, região central, que compram doces para presentear e para eventos.",
      tone: "Leve, divertido e acolhedor. Usa emojis com moderação e fala como uma amiga confeiteira.",
      dos: "Fotos com luz natural\nMostrar mãos preparando\nSempre CTA para o direct",
      donts: "Falar de dieta ou calorias\nFotos com fundo bagunçado\nPreço em letras miúdas",
      pillars,
      value_proposition: "Doces artesanais feitos no dia, para transformar qualquer data em uma lembrança gostosa.",
      differentials: "Receitas da família desde 1998\nEntrega no mesmo dia na região central\nCaixas personalizadas para presente",
      diagnosis: {
        summary: "Perfil com boa estética, mas pouca frequência e quase nenhum vídeo. Engajamento concentrado em posts de produto.",
        current_situation: "8,2 mil seguidores · 2 posts por semana · alcance médio de 1,5 mil por post",
        strengths: "Fotos bonitas\nClientes fiéis que marcam o perfil\nProduto muito fotogênico",
        weaknesses: "Pouco Reels\nLegendas sem chamada para ação\nStories irregulares",
        opportunities: "Datas comemorativas (Páscoa, Dia das Mães)\nParcerias com floriculturas\nConteúdo de bastidores",
        threats: "Novas confeitarias no bairro com preço menor\nApps de delivery com promoções agressivas",
      },
      personas: [
        { id: "pe1", name: "Mariana, a presenteadora", age: "32 anos", occupation: "Analista de RH", pains: "Não tem tempo de pensar em presentes criativos; tem medo de errar no presente.", desires: "Surpreender amigas e família com algo bonito e especial sem esforço.", objections: "Preço acima do supermercado; prazo de entrega.", channels: "Instagram, WhatsApp, Pinterest", quote: "Quero algo bonito que chegue hoje ainda." },
      ],
      competitors: [
        { id: "co1", name: "Doce Ponto", handle: "@doceponto", link: "", strengths: "Reels frequentes e bem editados; preço menor.", weaknesses: "Fotos com pouca qualidade; atendimento demorado.", notes: "Postam todos os dias às 18h." },
        { id: "co2", name: "Ateliê do Açúcar", handle: "@ateliedoacucar", link: "", strengths: "Estética impecável e embalagens premium.", weaknesses: "Pouca interação com seguidores.", notes: "" },
      ],
      products: [
        { id: "pr1", name: "Caixa presente 12 doces", price: 89.9, description: "Brigadeiros gourmet sortidos em caixa com laço.", differential: "Personalização com cartão escrito à mão", link: "" },
        { id: "pr2", name: "Bolo de pote", price: 18, description: "Sabores ninho com morango, chocolate belga e red velvet.", differential: "Feito no dia", link: "" },
      ],
      weekly_schedule: [
        { id: "s1", weekday: 1, time: "11:00", format: "feed", pillar_id: "pl1", note: "Destaque da semana" },
        { id: "s2", weekday: 3, time: "18:00", format: "reels", pillar_id: "pl2", note: "Processo de preparo" },
        { id: "s3", weekday: 5, time: "12:00", format: "carousel", pillar_id: "pl3", note: "Depoimentos" },
        { id: "s4", weekday: 6, time: "10:00", format: "story", pillar_id: "pl4", note: "Enquete do fim de semana" },
      ],
    },
    notes: [
      { id: "n1", kind: "idea", title: "Série 'Do forno pra você'", body: "Reels curtos mostrando cada etapa de um doce, um por semana.", pillar_id: "pl2", status: "approved", pinned: true, created_at: new Date().toISOString() },
      { id: "n2", kind: "insight", title: "Carrosséis salvam mais", body: "Nos últimos 30 dias, carrosséis tiveram 2x mais salvamentos que posts simples. Priorizar receitas e dicas em carrossel.", pillar_id: null, status: "new", pinned: false, created_at: new Date(Date.now() - 86400000).toISOString() },
      { id: "n3", kind: "reference", title: "Perfil de referência", body: "Estética de fotos com fundo neutro e luz lateral.", link: "https://instagram.com", pillar_id: "pl1", status: "new", pinned: false, created_at: new Date(Date.now() - 3 * 86400000).toISOString() },
      { id: "n4", kind: "idea", title: "Sorteio de aniversário", body: "Caixa de doces para quem marcar 2 amigos e compartilhar nos stories.", pillar_id: "pl4", status: "new", pinned: false, created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
    ],
  };
}
