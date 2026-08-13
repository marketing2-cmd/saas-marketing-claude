"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Plus, X, Check, Trash2, MessageSquare, Calendar, Search,
  LayoutGrid, List as ListIcon, Zap, Package, Users, Wallet,
  GripVertical, AlertTriangle, Loader2, Inbox, Sparkles,
  ChevronLeft, ChevronRight, Mail, Phone, Building2, CalendarDays,
  ArrowRight, UserPlus,
} from "lucide-react";
import { loadEntity, useAutoSave, suggestDemandWithAI } from "@/lib/api-client";

/* ============================= CONSTANTS ============================= */

const C = {
  paper: "#F5F6F3",
  paperDeep: "#EAEBE5",
  surface: "#FFFFFF",
  ink: "#0A0E1A",
  inkSoft: "#4A4E5C",
  inkFaint: "#8A8DA0",
  copper: "#0038FF",
  copperDeep: "#0026B8",
  copperSoft: "#E3EAFF",
  teal: "#00A99D",
  tealSoft: "#D8F0EC",
  danger: "#E23744",
  dangerSoft: "#FBDEE1",
  amber: "#C9960A",
  amberSoft: "#F6EBC8",
  indigo: "#5B6C9E",
  indigoSoft: "#DFE3EF",
  border: "#DDE0E6",
  borderSoft: "#EAECEF",
  yellow: "#FFC700",
  yellowSoft: "#FFF3C2",
};

const PROJECT_STATUSES = ["Backlog", "Planejamento", "Em Andamento", "Revisão", "Concluído"];
const CAMPAIGN_STATUSES = ["Planejamento", "Aprovação", "Em Execução", "No Ar", "Finalizada"];
const DEMAND_STATUSES = ["Nova", "Em Triagem", "Em Execução", "Concluída", "Descartada"];

const PRIORITIES = [
  { key: "Baixa", color: C.inkFaint },
  { key: "Média", color: C.amber },
  { key: "Alta", color: C.copper },
  { key: "Urgente", color: C.danger },
];

const CATEGORIES = ["Elétrica", "Hidráulica", "Ferramentas", "Iluminação", "Utilidades", "Institucional"];
const AREAS = ["Loja Física", "WhatsApp", "CRM", "Redes Sociais", "Eventos", "Comunidade", "Tráfego Pago", "Trade Marketing"];

const DEMAND_CHANNELS = ["WhatsApp", "E-mail", "Reunião", "Verbal", "Formulário", "Outro"];
const DEMAND_CATEGORIES = ["Rotina", "Projeto", "Campanha", "Urgente", "Backlog", "Delegável", "Descartar"];
const IMPACTS = ["Baixo", "Médio", "Alto"];

const DEMAND_CATEGORY_COLOR = {
  Rotina: C.amber, Projeto: C.copper, Campanha: C.teal,
  Urgente: C.danger, Backlog: C.inkFaint, Delegável: C.indigo, Descartar: C.inkFaint,
};

const TX_TYPES = ["Aporte recebido", "Investimento em campanha", "Contrapartida (material)"];

const PROSPECT_STAGES = ["Prospectar", "Em Contato", "Negociando", "Assinar Termo", "Termo Assinado"];
const PAYMENT_METHODS = ["Abatimento em boleto", "Bonificação", "Pix"];
const PAYMENT_METHOD_COLOR = { "Abatimento em boleto": C.indigo, "Bonificação": C.amber, "Pix": C.teal };

const EVENT_TYPES = ["Reunião", "Treinamento", "Data comercial", "Entrega", "Lançamento", "Outro"];
const EVENT_TYPE_COLOR = {
  Reunião: C.indigo, Treinamento: C.teal, "Data comercial": C.copper,
  Entrega: C.amber, Lançamento: C.danger, Outro: C.inkFaint,
};

const KANBAN_TABS = ["projects", "campaigns", "demands"];

/* ============================= HELPERS ============================= */

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

const fmtMoney = (n) => {
  const v = Number(n) || 0;
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
};

const fmtDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d + "T00:00:00");
  if (isNaN(dt)) return "—";
  return dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
};

const daysUntil = (d) => {
  if (!d) return null;
  const dt = new Date(d + "T00:00:00");
  if (isNaN(dt)) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((dt - today) / 86400000);
};

const toISODate = (d) => d.toISOString().slice(0, 10);

const initials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1] ? parts[1][0] : "")).toUpperCase();
};

const priorityColor = (p) => (PRIORITIES.find((x) => x.key === p) || PRIORITIES[0]).color;

const avatarPalette = ["#0038FF", "#00A99D", "#C9960A", "#5B6C9E", "#E23744", "#1F2A44"];
const avatarColor = (name) => {
  let h = 0;
  for (let i = 0; i < (name || "").length; i++) h = (h * 31 + name.charCodeAt(i)) % avatarPalette.length;
  return avatarPalette[Math.abs(h)];
};

function nowIso() { return new Date().toISOString(); }
function nextDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/* ============================= PERSISTÊNCIA (username local ao navegador) ============================= */

const K_USERNAME = "contattos-mkos-username";

/* ============================= SEED DATA ============================= */

const seedProjects = () => [
  {
    id: uid(), name: "Reposicionamento de vitrine — Linha Iluminação",
    objective: "Aumentar conversão de passantes em loja física",
    description: "Redesenhar a vitrine principal para destacar a nova linha de LED, com sinalização de preço e QR code para catálogo completo.",
    category: "Iluminação", area: "Loja Física", status: "Em Andamento", owner: "Marina Costa",
    team: ["Marina Costa", "Diego Alves"], supplier: "Osram", investment: 4200, deadline: nextDate(6), priority: "Alta",
    checklist: [
      { id: uid(), text: "Brief com o visual merchandising", done: true },
      { id: uid(), text: "Aprovar peças com fornecedor", done: true },
      { id: uid(), text: "Instalação na loja", done: false },
      { id: uid(), text: "Fotos do resultado final", done: false },
    ],
    comments: [{ id: uid(), text: "Fornecedor confirmou contrapartida de R$1.500 em materiais.", author: "Marina Costa", date: nowIso() }],
    createdAt: nowIso(), updatedAt: nowIso(),
  },
  {
    id: uid(), name: "Catálogo digital de Ferramentas 2026",
    objective: "Dar suporte a vendedores e ao tráfego pago com peça de referência",
    description: "PDF interativo com todas as linhas de ferramentas, preços sugeridos e QR codes por categoria.",
    category: "Ferramentas", area: "CRM", status: "Planejamento", owner: "Diego Alves",
    team: ["Diego Alves"], supplier: "Bosch", investment: 1800, deadline: nextDate(18), priority: "Média",
    checklist: [{ id: uid(), text: "Levantar SKUs com o comercial", done: true }, { id: uid(), text: "Diagramação", done: false }],
    comments: [], createdAt: nowIso(), updatedAt: nowIso(),
  },
  {
    id: uid(), name: "Treinamento de equipe — Hidráulica", objective: "Capacitar vendedores sobre a nova linha de conexões",
    description: "", category: "Hidráulica", area: "Eventos", status: "Backlog", owner: "Marina Costa",
    team: [], supplier: "Tigre", investment: 0, deadline: "", priority: "Baixa",
    checklist: [], comments: [], createdAt: nowIso(), updatedAt: nowIso(),
  },
];

const seedCampaigns = () => [
  {
    id: uid(), name: "Semana do Eletricista",
    objective: "Gerar tráfego na loja e vendas da linha elétrica com desconto de parceiros",
    supplier: "Schneider Electric", categories: ["Elétrica"], products: ["Disjuntores", "Fios e cabos", "Tomadas"],
    team: ["Marina Costa", "Diego Alves"], budget: 12000, budgetSpent: 7400, startDate: nextDate(2), endDate: nextDate(9),
    checklist: [
      { id: uid(), text: "Aprovar verba com fornecedor", done: true },
      { id: uid(), text: "Criar peças para redes sociais", done: true },
      { id: uid(), text: "Disparo WhatsApp para base", done: false },
      { id: uid(), text: "Ativação de tráfego pago", done: false },
    ],
    status: "Em Execução", roi: null, results: "", materials: ["Banner loja", "Stories", "Cartaz PDV"],
    prospects: [
      { id: uid(), supplier: "Schneider Electric", contact: "Carla Nunes", stage: "Termo Assinado", value: 12000, paymentMethod: "Bonificação", notes: "Verba principal da campanha.", aporteRegistrado: true, createdAt: nowIso(), updatedAt: nowIso() },
      { id: uid(), supplier: "Intelbras", contact: "", stage: "Negociando", value: 4000, paymentMethod: "Pix", notes: "Aguardando contraproposta.", aporteRegistrado: false, createdAt: nowIso(), updatedAt: nowIso() },
      { id: uid(), supplier: "WEG", contact: "", stage: "Prospectar", value: "", paymentMethod: PAYMENT_METHODS[0], notes: "", aporteRegistrado: false, createdAt: nowIso(), updatedAt: nowIso() },
    ],
    comments: [], createdAt: nowIso(), updatedAt: nowIso(),
  },
  {
    id: uid(), name: "Dia das Mães — Utilidades para Casa", objective: "Impulsionar vendas de utilidades no período sazonal",
    supplier: "Tramontina", categories: ["Utilidades"], products: ["Panelas", "Organizadores"],
    team: ["Marina Costa"], budget: 6000, budgetSpent: 0, startDate: nextDate(20), endDate: nextDate(28),
    checklist: [{ id: uid(), text: "Definir mecânica da promoção", done: false }],
    status: "Planejamento", roi: null, results: "", materials: [],
    prospects: [
      { id: uid(), supplier: "Tramontina", contact: "Juliana Prado", stage: "Assinar Termo", value: 6000, paymentMethod: "Abatimento em boleto", notes: "Termo enviado, aguardando assinatura.", aporteRegistrado: false, createdAt: nowIso(), updatedAt: nowIso() },
    ],
    comments: [], createdAt: nowIso(), updatedAt: nowIso(),
  },
];

const seedDemands = () => [
  {
    id: uid(), title: "Cliente pediu catálogo impresso na loja",
    description: "Cliente recorrente pediu catálogo físico atualizado de ferramentas na próxima visita.",
    channel: "WhatsApp", requester: "Fernanda (atendente loja)", category: "Rotina", priority: "Baixa",
    owner: "Diego Alves", deadline: nextDate(5), impact: "Baixo", status: "Nova", aiNote: "",
    linkedType: "", linkedId: "", comments: [], createdAt: nowIso(), updatedAt: nowIso(),
  },
  {
    id: uid(), title: "Fornecedor Tramontina quer antecipar campanha do Dia das Mães",
    description: "Representante sugeriu adiantar em 1 semana, com verba extra de R$2.000 se aprovado até sexta.",
    channel: "E-mail", requester: "Representante Tramontina", category: "Campanha", priority: "Alta",
    owner: "Marina Costa", deadline: nextDate(3), impact: "Alto", status: "Em Triagem", aiNote: "",
    linkedType: "", linkedId: "", comments: [], createdAt: nowIso(), updatedAt: nowIso(),
  },
  {
    id: uid(), title: "Vazamento na loja atrasou instalação da vitrine",
    description: "Manutenção precisa entrar antes da equipe de visual merchandising.",
    channel: "Verbal", requester: "Gerente de loja", category: "Urgente", priority: "Urgente",
    owner: "", deadline: nextDate(1), impact: "Alto", status: "Nova", aiNote: "",
    linkedType: "", linkedId: "", comments: [], createdAt: nowIso(), updatedAt: nowIso(),
  },
];

const seedSuppliers = () => [
  {
    id: uid(), name: "Schneider Electric", brands: ["Schneider"], representative: "Carla Nunes",
    email: "carla@schneider.com.br", phone: "(11) 98888-0000", annualBudget: 40000,
    transactions: [
      { id: uid(), type: "Aporte recebido", description: "Repasse de verba — 1º semestre", amount: 20000, date: nextDate(-40) },
      { id: uid(), type: "Contrapartida (material)", description: "Banners e material de PDV", amount: 1500, date: nextDate(-20) },
    ],
    notes: "Parceiro estratégico da linha elétrica. Renovação de verba em dezembro.",
    createdAt: nowIso(),
  },
  {
    id: uid(), name: "Osram", brands: ["Osram", "Ledvance"], representative: "Paulo Reis",
    email: "paulo@osram.com", phone: "", annualBudget: 15000,
    transactions: [{ id: uid(), type: "Aporte recebido", description: "Verba campanha vitrine", amount: 5000, date: nextDate(-10) }],
    notes: "", createdAt: nowIso(),
  },
  {
    id: uid(), name: "Tramontina", brands: ["Tramontina"], representative: "Juliana Prado",
    email: "", phone: "(51) 97777-1234", annualBudget: 18000, transactions: [],
    notes: "Costuma liberar verba extra para datas sazonais.", createdAt: nowIso(),
  },
];

const seedEvents = () => [
  { id: uid(), title: "Reunião mensal de marketing", type: "Reunião", date: nextDate(4), description: "" },
  { id: uid(), title: "Treinamento equipe de vendas — Hidráulica", type: "Treinamento", date: nextDate(10), description: "" },
  { id: uid(), title: "Dia do Eletricista", type: "Data comercial", date: nextDate(15), description: "" },
];

const seedTeam = () => [
  {
    id: uid(), name: "Marina Costa", role: "Head de Marketing", email: "marina@contattosmais.com.br", phone: "",
    skills: ["Estratégia", "Trade Marketing", "Fornecedores"], vacationStart: "", vacationEnd: "",
    goals: "Aumentar o ROI de campanhas cooperadas em 20% no semestre.", feedbacks: [], createdAt: nowIso(),
  },
  {
    id: uid(), name: "Diego Alves", role: "Analista de Conteúdo", email: "diego@contattosmais.com.br", phone: "",
    skills: ["Redes Sociais", "Design", "Copywriting"], vacationStart: "", vacationEnd: "",
    goals: "", feedbacks: [], createdAt: nowIso(),
  },
  {
    id: uid(), name: "Bruno Ferreira", role: "Analista de Trade Marketing", email: "bruno@contattosmais.com.br", phone: "",
    skills: ["PDV", "Promotores", "Eventos"], vacationStart: "", vacationEnd: "",
    goals: "", feedbacks: [], createdAt: nowIso(),
  },
];

/* ============================= SMALL UI PRIMITIVES ============================= */

function Pill({ children, color, soft, style }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
      style={{ color: color || C.ink, background: soft || C.paperDeep, border: `1px solid ${C.border}`, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.01em", ...style }}>
      {children}
    </span>
  );
}

function Avatar({ name, size = 24 }) {
  return (
    <div title={name} style={{
      width: size, height: size, borderRadius: "50%", background: avatarColor(name), color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.4, fontWeight: 700,
      fontFamily: "'Space Grotesk', sans-serif", flexShrink: 0,
    }}>
      {initials(name)}
    </div>
  );
}

function AvatarStack({ names = [] }) {
  if (!names.length) return <span style={{ color: C.inkFaint, fontSize: 12 }}>Sem responsável</span>;
  return (
    <div className="flex items-center" style={{ marginLeft: 4 }}>
      {names.slice(0, 4).map((n, i) => (
        <div key={n + i} style={{ marginLeft: -6, border: `2px solid ${C.surface}`, borderRadius: "50%" }}>
          <Avatar name={n} size={22} />
        </div>
      ))}
      {names.length > 4 && <span style={{ marginLeft: 2, fontSize: 11, color: C.inkFaint }}>+{names.length - 4}</span>}
    </div>
  );
}

function TagInput({ value = [], onChange, placeholder, suggestions = [], listId }) {
  const [text, setText] = useState("");
  const commit = () => {
    const t = text.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setText("");
  };
  const dlId = listId || "mkos-suggestions-" + placeholder;
  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-1.5">
        {value.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs" style={{ background: C.paperDeep, border: `1px solid ${C.border}`, color: C.ink }}>
            {v}<X size={11} className="cursor-pointer" onClick={() => onChange(value.filter((x) => x !== v))} />
          </span>
        ))}
      </div>
      <input className="mkos-input" list={dlId} value={text} placeholder={placeholder} onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); commit(); } }} onBlur={commit} />
      <datalist id={dlId}>{suggestions.map((s) => <option value={s} key={s} />)}</datalist>
    </div>
  );
}

function Field({ label, children, full }) {
  return (
    <div style={{ gridColumn: full ? "1 / -1" : "auto" }}>
      <div className="mkos-label">{label}</div>
      {children}
    </div>
  );
}

function LoadBar({ pct }) {
  const clamped = Math.min(Math.max(pct, 0), 100);
  const over = pct > 100;
  return (
    <div style={{ height: 6, background: C.paperDeep, borderRadius: 3, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${clamped}%`, background: over ? C.danger : pct > 80 ? C.amber : C.teal, transition: "width .3s ease" }} />
    </div>
  );
}

function ChecklistProgress({ checklist = [] }) {
  if (!checklist.length) return null;
  const done = checklist.filter((c) => c.done).length;
  return <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.inkFaint }}><Check size={11} /> {done}/{checklist.length}</div>;
}

function ConfirmModal({ onCancel, onConfirm, label }) {
  return (
    <div className="mkos-overlay" onClick={onCancel}>
      <div className="mkos-confirm" onClick={(e) => e.stopPropagation()}>
        <AlertTriangle size={20} color={C.danger} style={{ marginBottom: 8 }} />
        <div style={{ fontWeight: 600, color: C.ink, marginBottom: 4 }}>Excluir {label}?</div>
        <div style={{ fontSize: 12.5, color: C.inkSoft, marginBottom: 16 }}>Essa ação não pode ser desfeita.</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="mkos-btn-secondary" onClick={onCancel}>Cancelar</button>
          <button className="mkos-btn-danger" onClick={onConfirm}>Excluir</button>
        </div>
      </div>
    </div>
  );
}

/* ============================= APP ============================= */

export default function MarketingOS() {
  const [loaded, setLoaded] = useState(false);
  const [projects, setProjects] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [demands, setDemands] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [events, setEvents] = useState([]);
  const [team, setTeam] = useState([]);

  const [tab, setTab] = useState("projects");
  const [view, setView] = useState("board");
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [username, setUsername] = useState("");
  const [dragId, setDragId] = useState(null);

  useEffect(() => {
    (async () => {
      const [p, c, d, s, e, t] = await Promise.all([
        loadEntity("projects"), loadEntity("campaigns"), loadEntity("demands"),
        loadEntity("suppliers"), loadEntity("events"), loadEntity("team"),
      ]);
      setProjects(p !== null ? p : seedProjects());
      setCampaigns(c !== null ? c : seedCampaigns());
      setDemands(d !== null ? d : seedDemands());
      setSuppliers(s !== null ? s : seedSuppliers());
      setEvents(e !== null ? e : seedEvents());
      setTeam(t !== null ? t : seedTeam());
      setUsername(typeof window !== "undefined" ? window.localStorage.getItem(K_USERNAME) || "" : "");
      setLoaded(true);
    })();
  }, []);

  useAutoSave("projects", projects, loaded);
  useAutoSave("campaigns", campaigns, loaded);
  useAutoSave("demands", demands, loaded);
  useAutoSave("suppliers", suppliers, loaded);
  useAutoSave("events", events, loaded);
  useAutoSave("team", team, loaded);

  const setName = (n) => {
    setUsername(n);
    if (typeof window !== "undefined") window.localStorage.setItem(K_USERNAME, n);
  };

  const teamNames = useMemo(() => {
    const s = new Set(team.map((m) => m.name));
    projects.forEach((p) => (p.team || []).forEach((t) => s.add(t)));
    campaigns.forEach((c) => (c.team || []).forEach((t) => s.add(t)));
    return Array.from(s).filter(Boolean);
  }, [team, projects, campaigns]);

  const supplierNames = useMemo(() => {
    const s = new Set(suppliers.map((x) => x.name));
    projects.forEach((p) => p.supplier && s.add(p.supplier));
    campaigns.forEach((c) => c.supplier && s.add(c.supplier));
    return Array.from(s).filter(Boolean);
  }, [suppliers, projects, campaigns]);

  const isKanban = KANBAN_TABS.includes(tab);
  const itemsByTab = { projects, campaigns, demands };
  const setItemsByTab = { projects: setProjects, campaigns: setCampaigns, demands: setDemands };
  const statusesByTab = { projects: PROJECT_STATUSES, campaigns: CAMPAIGN_STATUSES, demands: DEMAND_STATUSES };

  const items = itemsByTab[tab] || [];
  const setItems = setItemsByTab[tab];
  const statuses = statusesByTab[tab] || [];

  const filtered = useMemo(() => {
    if (!isKanban) return [];
    return items.filter((it) => {
      if (search && !(it.name || it.title || "").toLowerCase().includes(search.toLowerCase())) return false;
      if (filterPriority && it.priority !== filterPriority) return false;
      if (filterCategory) {
        if (tab === "campaigns") { if (!(it.categories || []).includes(filterCategory)) return false; }
        else if (tab === "projects") { if (it.category !== filterCategory) return false; }
        else if (tab === "demands") { if (it.category !== filterCategory) return false; }
      }
      return true;
    });
  }, [items, search, filterPriority, filterCategory, tab, isKanban]);

  const grouped = useMemo(() => {
    const g = {};
    statuses.forEach((s) => (g[s] = []));
    filtered.forEach((it) => { if (!g[it.status]) g[it.status] = []; g[it.status].push(it); });
    return g;
  }, [filtered, statuses]);

  const stats = useMemo(() => {
    if (tab === "projects") {
      const overdue = projects.filter((p) => { const d = daysUntil(p.deadline); return d !== null && d < 0 && p.status !== "Concluído"; }).length;
      const active = projects.filter((p) => p.status === "Em Andamento").length;
      return [
        { label: "Projetos ativos", value: projects.length },
        { label: "Em andamento", value: active },
        { label: "Atrasados", value: overdue, danger: overdue > 0 },
        { label: "Investimento total", value: fmtMoney(projects.reduce((a, p) => a + (Number(p.investment) || 0), 0)) },
      ];
    }
    if (tab === "campaigns") {
      const totalBudget = campaigns.reduce((a, c) => a + (Number(c.budget) || 0), 0);
      const totalSpent = campaigns.reduce((a, c) => a + (Number(c.budgetSpent) || 0), 0);
      const live = campaigns.filter((c) => c.status === "No Ar" || c.status === "Em Execução").length;
      return [
        { label: "Campanhas", value: campaigns.length },
        { label: "No ar / em execução", value: live },
        { label: "Verba total", value: fmtMoney(totalBudget) },
        { label: "Investido", value: fmtMoney(totalSpent), danger: totalSpent > totalBudget },
      ];
    }
    const novas = demands.filter((d) => d.status === "Nova").length;
    const urgentes = demands.filter((d) => d.category === "Urgente" && d.status !== "Concluída" && d.status !== "Descartada").length;
    const overdue = demands.filter((d) => { const x = daysUntil(d.deadline); return x !== null && x < 0 && d.status !== "Concluída" && d.status !== "Descartada"; }).length;
    return [
      { label: "Demandas abertas", value: demands.filter((d) => d.status !== "Concluída" && d.status !== "Descartada").length },
      { label: "Novas", value: novas },
      { label: "Urgentes", value: urgentes, danger: urgentes > 0 },
      { label: "Atrasadas", value: overdue, danger: overdue > 0 },
    ];
  }, [tab, projects, campaigns, demands]);

  function defaultItem(kind) {
    if (kind === "projects") return { id: uid(), name: "", objective: "", description: "", category: CATEGORIES[0], area: AREAS[0], status: PROJECT_STATUSES[0], owner: username || "", team: [], supplier: "", investment: "", deadline: "", priority: "Média", checklist: [], comments: [], createdAt: nowIso(), updatedAt: nowIso() };
    if (kind === "campaigns") return { id: uid(), name: "", objective: "", supplier: "", categories: [], products: [], team: [], budget: "", budgetSpent: "", startDate: "", endDate: "", checklist: [], status: CAMPAIGN_STATUSES[0], roi: "", results: "", materials: [], prospects: [], comments: [], createdAt: nowIso(), updatedAt: nowIso() };
    return { id: uid(), title: "", description: "", channel: DEMAND_CHANNELS[0], requester: "", category: DEMAND_CATEGORIES[0], priority: "Média", owner: "", deadline: "", impact: "Médio", status: DEMAND_STATUSES[0], aiNote: "", linkedType: "", linkedId: "", comments: [], createdAt: nowIso(), updatedAt: nowIso() };
  }

  function openNew() { setEditing({ type: tab, data: defaultItem(tab), isNew: true }); }
  function openItem(kind, it) { setEditing({ type: kind, data: JSON.parse(JSON.stringify(it)), isNew: false }); }

  function commitEdit(data) {
    data.updatedAt = nowIso();
    const kind = editing.type;
    setItemsByTab[kind]((prev) => {
      const exists = prev.some((p) => p.id === data.id);
      return exists ? prev.map((p) => (p.id === data.id ? data : p)) : [data, ...prev];
    });
    setEditing(null);
  }

  function removeItem(kind, id) {
    setItemsByTab[kind]((prev) => prev.filter((p) => p.id !== id));
    setConfirmDelete(null);
    setEditing(null);
  }

  function moveStatus(id, newStatus) {
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, status: newStatus, updatedAt: nowIso() } : p)));
  }

  function promoteDemand(demand, targetKind) {
    const base = defaultItem(targetKind);
    base.name = demand.title;
    base.objective = demand.description || demand.title;
    setItemsByTab[targetKind]((prev) => [base, ...prev]);
    setDemands((prev) => prev.map((d) => (d.id === demand.id ? { ...d, status: "Concluída", linkedType: targetKind, linkedId: base.id, updatedAt: nowIso() } : d)));
    setEditing({ type: targetKind, data: base, isNew: false });
  }

  if (!loaded) {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 400, color: C.inkSoft, fontFamily: "'Inter', sans-serif" }}><Loader2 className="animate-spin" size={18} style={{ marginRight: 8 }} /> Carregando Marketing OS…</div>;
  }

  const NAV = [
    { key: "projects", label: "Projetos", icon: Package },
    { key: "campaigns", label: "Campanhas", icon: Zap },
    { key: "demands", label: "Demandas", icon: Inbox },
    { key: "suppliers", label: "Verba Cooperada", icon: Wallet },
    { key: "calendar", label: "Calendário", icon: CalendarDays },
    { key: "team", label: "Equipe", icon: Users },
  ];

  const filterCategoryOptions = tab === "demands" ? DEMAND_CATEGORIES : CATEGORIES;
  const searchPlaceholder = tab === "projects" ? "Buscar projeto…" : tab === "campaigns" ? "Buscar campanha…" : "Buscar demanda…";
  const newLabel = tab === "projects" ? "Novo projeto" : tab === "campaigns" ? "Nova campanha" : "Nova demanda";

  return (
    <div className="mkos-root mkos-shell" style={{ background: C.paper, minHeight: 640, borderRadius: 12, border: `1px solid ${C.border}`, display: "flex", overflow: "hidden" }}>
      <GlobalStyle />

      {/* SIDEBAR */}
      <div className="mkos-sidebar">
        <div className="mkos-brand">
          <div className="mkos-brand-icon"><Zap size={16} color="#fff" strokeWidth={2.5} /></div>
          <div>
            <div className="mkos-brand-title">Marketing OS</div>
            <div className="mkos-brand-sub">Contattos+</div>
          </div>
        </div>
        <div className="mkos-nav">
          {NAV.map((n) => (
            <button key={n.key} className="mkos-nav-item" onClick={() => { setTab(n.key); setSearch(""); setFilterPriority(""); setFilterCategory(""); }}
              style={{ color: tab === n.key ? C.copper : C.inkSoft, background: tab === n.key ? C.copperSoft : "transparent", borderLeft: tab === n.key ? `3px solid ${C.yellow}` : "3px solid transparent" }}>
              <n.icon size={15} /> <span>{n.label}</span>
            </button>
          ))}
        </div>
        <div className="mkos-sidebar-foot">
          <input className="mkos-username" placeholder="Seu nome" value={username} onChange={(e) => setName(e.target.value)} title="Usado para identificar seus comentários" />
          <div className="mkos-sync"><span style={{ width: 6, height: 6, borderRadius: 99, background: C.teal, display: "inline-block" }} /> sincronizado</div>
        </div>
      </div>

      {/* MAIN */}
      <div className="mkos-main">
        {isKanban ? (
          <>
            <div className="mkos-stats">
              {stats.map((s) => (
                <div className="mkos-stat" key={s.label}>
                  <div style={{ fontSize: 11, color: C.inkFaint, textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, color: s.danger ? C.danger : C.ink }}>{s.value}</div>
                </div>
              ))}
            </div>

            <div className="mkos-toolbar">
              <div className="mkos-search"><Search size={13} color={C.inkFaint} /><input placeholder={searchPlaceholder} value={search} onChange={(e) => setSearch(e.target.value)} /></div>
              <select className="mkos-select" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
                <option value="">Prioridade: todas</option>
                {PRIORITIES.map((p) => <option key={p.key} value={p.key}>{p.key}</option>)}
              </select>
              <select className="mkos-select" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                <option value="">Categoria: todas</option>
                {filterCategoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <div style={{ flex: 1 }} />
              <button className="mkos-icon-btn" style={{ background: view === "board" ? C.surface : "transparent" }} onClick={() => setView("board")} title="Quadro"><LayoutGrid size={14} /></button>
              <button className="mkos-icon-btn" style={{ background: view === "list" ? C.surface : "transparent" }} onClick={() => setView("list")} title="Lista"><ListIcon size={14} /></button>
              <button className="mkos-btn-primary" onClick={openNew}><Plus size={14} /> {newLabel}</button>
            </div>

            <div className="mkos-scroll">
              {view === "board" ? (
                <Board statuses={statuses} grouped={grouped} kind={tab} onOpen={openItem} onMove={moveStatus} dragId={dragId} setDragId={setDragId} />
              ) : (
                <TableView items={filtered} kind={tab} onOpen={openItem} />
              )}
              {filtered.length === 0 && <div style={{ textAlign: "center", padding: "48px 0", color: C.inkFaint, fontSize: 13 }}>Nada por aqui ainda.</div>}
            </div>
          </>
        ) : tab === "suppliers" ? (
          <SuppliersView suppliers={suppliers} setSuppliers={setSuppliers} campaigns={campaigns} onDelete={(id) => setConfirmDelete({ kind: "suppliers", id })} />
        ) : tab === "calendar" ? (
          <CalendarView projects={projects} campaigns={campaigns} demands={demands} events={events} setEvents={setEvents} onOpenItem={openItem} />
        ) : (
          <TeamView team={team} setTeam={setTeam} projects={projects} campaigns={campaigns} demands={demands} username={username} onDelete={(id) => setConfirmDelete({ kind: "team", id })} />
        )}
      </div>

      {editing && (
        <EditDrawer editing={editing} onClose={() => setEditing(null)} onSave={commitEdit}
          onDelete={(id) => setConfirmDelete({ kind: editing.type, id })} teamSuggestions={teamNames}
          supplierSuggestions={supplierNames} username={username} onPromote={promoteDemand}
          suppliers={suppliers} setSuppliers={setSuppliers} />
      )}

      {confirmDelete && (
        <ConfirmModal onCancel={() => setConfirmDelete(null)} onConfirm={() => {
          if (confirmDelete.kind === "suppliers") setSuppliers((prev) => prev.filter((s) => s.id !== confirmDelete.id));
          else if (confirmDelete.kind === "team") setTeam((prev) => prev.filter((s) => s.id !== confirmDelete.id));
          else removeItem(confirmDelete.kind, confirmDelete.id);
          setConfirmDelete(null);
        }} label={confirmDelete.kind === "projects" ? "projeto" : confirmDelete.kind === "campaigns" ? "campanha" : confirmDelete.kind === "demands" ? "demanda" : confirmDelete.kind === "suppliers" ? "fornecedor" : "membro"} />
      )}
    </div>
  );
}

/* ============================= BOARD / CARDS ============================= */

function Board({ statuses, grouped, kind, onOpen, onMove, dragId, setDragId }) {
  return (
    <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
      {statuses.map((status) => (
        <div key={status} className="mkos-column" onDragOver={(e) => e.preventDefault()} onDrop={() => { if (dragId) onMove(dragId, status); setDragId(null); }}>
          <div className="mkos-column-head"><span>{status}</span><span className="mkos-column-count">{(grouped[status] || []).length}</span></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, minHeight: 40 }}>
            {(grouped[status] || []).map((it) => {
              if (kind === "projects") return <ProjectCard key={it.id} p={it} onOpen={() => onOpen("projects", it)} onDragStart={() => setDragId(it.id)} />;
              if (kind === "campaigns") return <CampaignCard key={it.id} c={it} onOpen={() => onOpen("campaigns", it)} onDragStart={() => setDragId(it.id)} />;
              return <DemandCard key={it.id} d={it} onOpen={() => onOpen("demands", it)} onDragStart={() => setDragId(it.id)} />;
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProjectCard({ p, onOpen, onDragStart }) {
  const d = daysUntil(p.deadline);
  const overdue = d !== null && d < 0 && p.status !== "Concluído";
  return (
    <div className="mkos-card" draggable onDragStart={onDragStart} onClick={onOpen}>
      <div className="flex items-start justify-between" style={{ marginBottom: 6 }}>
        <Pill color={priorityColor(p.priority)}>{p.priority}</Pill>
        <GripVertical size={13} color={C.inkFaint} />
      </div>
      <div style={{ fontWeight: 600, fontSize: 13, color: C.ink, marginBottom: 4, lineHeight: 1.3 }}>{p.name || "Sem título"}</div>
      {p.category && <div style={{ fontSize: 11, color: C.inkFaint, marginBottom: 8 }}>{p.category} · {p.area}</div>}
      <div className="flex items-center justify-between" style={{ marginTop: 6 }}>
        <ChecklistProgress checklist={p.checklist} />
        <div className="flex items-center gap-2">
          {p.deadline && <span style={{ fontSize: 11, color: overdue ? C.danger : C.inkFaint, display: "flex", alignItems: "center", gap: 3 }}><Calendar size={11} /> {fmtDate(p.deadline)}</span>}
          <AvatarStack names={p.team && p.team.length ? p.team : p.owner ? [p.owner] : []} />
        </div>
      </div>
    </div>
  );
}

function CampaignCard({ c, onOpen, onDragStart }) {
  const budget = Number(c.budget) || 0;
  const spent = Number(c.budgetSpent) || 0;
  const pct = budget > 0 ? (spent / budget) * 100 : 0;
  const prospects = c.prospects || [];
  const signed = prospects.filter((p) => p.stage === "Termo Assinado");
  const signedValue = signed.reduce((a, p) => a + (Number(p.value) || 0), 0);
  return (
    <div className="mkos-card" draggable onDragStart={onDragStart} onClick={onOpen}>
      <div className="flex items-start justify-between" style={{ marginBottom: 6 }}>
        <Pill soft={C.tealSoft} color={C.teal}>{c.supplier || "Sem fornecedor"}</Pill>
        <GripVertical size={13} color={C.inkFaint} />
      </div>
      <div style={{ fontWeight: 600, fontSize: 13, color: C.ink, marginBottom: 4, lineHeight: 1.3 }}>{c.name || "Sem título"}</div>
      {(c.categories || []).length > 0 && <div style={{ fontSize: 11, color: C.inkFaint, marginBottom: 8 }}>{c.categories.join(", ")}</div>}
      {budget > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div className="flex items-center justify-between" style={{ fontSize: 10.5, color: C.inkFaint, marginBottom: 3, fontFamily: "'IBM Plex Mono', monospace" }}>
            <span>{fmtMoney(spent)}</span><span>{fmtMoney(budget)}</span>
          </div>
          <LoadBar pct={pct} />
        </div>
      )}
      <div className="flex items-center justify-between">
        <ChecklistProgress checklist={c.checklist} />
        <div className="flex items-center gap-2">
          {c.endDate && <span style={{ fontSize: 11, color: C.inkFaint, display: "flex", alignItems: "center", gap: 3 }}><Calendar size={11} /> até {fmtDate(c.endDate)}</span>}
          <AvatarStack names={c.team || []} />
        </div>
      </div>
      {prospects.length > 0 && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.borderSoft}`, display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 10.5, color: C.inkFaint }}>
          <span>🤝 {prospects.length} fornecedor{prospects.length !== 1 ? "es" : ""} em prospecção</span>
          {signed.length > 0 && <span style={{ color: C.teal, fontWeight: 600 }}>{signed.length} assinado{signed.length !== 1 ? "s" : ""} · {fmtMoney(signedValue)}</span>}
        </div>
      )}
    </div>
  );
}

function DemandCard({ d, onOpen, onDragStart }) {
  const days = daysUntil(d.deadline);
  const overdue = days !== null && days < 0 && d.status !== "Concluída" && d.status !== "Descartada";
  const catColor = DEMAND_CATEGORY_COLOR[d.category] || C.inkFaint;
  return (
    <div className="mkos-card" draggable onDragStart={onDragStart} onClick={onOpen}>
      <div className="flex items-start justify-between" style={{ marginBottom: 6 }}>
        <Pill color={catColor}>{d.category}</Pill>
        <Pill color={priorityColor(d.priority)}>{d.priority}</Pill>
      </div>
      <div style={{ fontWeight: 600, fontSize: 13, color: C.ink, marginBottom: 4, lineHeight: 1.3, textDecoration: d.status === "Descartada" ? "line-through" : "none" }}>{d.title || "Sem título"}</div>
      <div style={{ fontSize: 11, color: C.inkFaint, marginBottom: 8 }}>{d.channel}{d.requester ? ` · ${d.requester}` : ""}</div>
      <div className="flex items-center justify-between">
        {d.deadline ? <span style={{ fontSize: 11, color: overdue ? C.danger : C.inkFaint, display: "flex", alignItems: "center", gap: 3 }}><Calendar size={11} /> {fmtDate(d.deadline)}</span> : <span />}
        <AvatarStack names={d.owner ? [d.owner] : []} />
      </div>
    </div>
  );
}

/* ============================= TABLE VIEW ============================= */

function TableView({ items, kind, onOpen }) {
  const isProjects = kind === "projects";
  const isDemands = kind === "demands";
  return (
    <div className="mkos-table-wrap">
      <table className="mkos-table">
        <thead>
          <tr>
            <th>Nome</th><th>Status</th><th>Prioridade</th>
            <th>{isProjects ? "Categoria" : isDemands ? "Categoria" : "Fornecedor"}</th>
            <th>Equipe</th>
            <th>{isDemands ? "Prazo" : isProjects ? "Prazo" : "Período"}</th>
            {!isDemands && <th>{isProjects ? "Investimento" : "Verba"}</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id} onClick={() => onOpen(kind, it)}>
              <td style={{ fontWeight: 600, color: C.ink }}>{it.name || it.title || "Sem título"}</td>
              <td><Pill>{it.status}</Pill></td>
              <td><Pill color={priorityColor(it.priority)}>{it.priority}</Pill></td>
              <td>{isProjects ? it.category : isDemands ? it.category : it.supplier}</td>
              <td><AvatarStack names={it.team || (it.owner ? [it.owner] : [])} /></td>
              <td style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>
                {isDemands || isProjects ? fmtDate(it.deadline) : `${fmtDate(it.startDate)} – ${fmtDate(it.endDate)}`}
              </td>
              {!isDemands && <td style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>{fmtMoney(isProjects ? it.investment : it.budget)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ============================= EDIT DRAWER (Projetos / Campanhas / Demandas) ============================= */

function EditDrawer({ editing, onClose, onSave, onDelete, teamSuggestions, supplierSuggestions, username, onPromote, suppliers, setSuppliers }) {
  const [data, setData] = useState(editing.data);
  const kind = editing.type;
  const isProjects = kind === "projects";
  const isCampaigns = kind === "campaigns";
  const isDemands = kind === "demands";
  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));

  const [checklistText, setChecklistText] = useState("");
  const [commentText, setCommentText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const [prospectEditing, setProspectEditing] = useState(null);

  const prospects = data.prospects || [];
  const setProspects = (list) => set("prospects", list);
  const groupedProspects = useMemo(() => {
    const g = {};
    PROSPECT_STAGES.forEach((s) => (g[s] = []));
    prospects.forEach((p) => { if (!g[p.stage]) g[p.stage] = []; g[p.stage].push(p); });
    return g;
  }, [prospects]);

  function openNewProspect() {
    setProspectEditing({ id: uid(), supplier: "", contact: "", stage: PROSPECT_STAGES[0], value: "", paymentMethod: PAYMENT_METHODS[0], notes: "", aporteRegistrado: false, createdAt: nowIso(), updatedAt: nowIso() });
  }
  function saveProspect(p) {
    p.updatedAt = nowIso();
    const exists = prospects.some((x) => x.id === p.id);
    setProspects(exists ? prospects.map((x) => (x.id === p.id ? p : x)) : [p, ...prospects]);
    setProspectEditing(null);
  }
  function deleteProspect(id) {
    setProspects(prospects.filter((x) => x.id !== id));
    setProspectEditing(null);
  }
  function moveProspectStage(id, stage) {
    setProspects(prospects.map((x) => (x.id === id ? { ...x, stage, updatedAt: nowIso() } : x)));
  }
  function registerAporte(p) {
    const name = (p.supplier || "").trim();
    if (!name) return;
    const desc = `Termo assinado — ${data.name || "campanha"} (${p.paymentMethod})`;
    const tx = { id: uid(), type: "Aporte recebido", description: desc, amount: Number(p.value) || 0, date: toISODate(new Date()) };
    setSuppliers((prev) => {
      const found = prev.find((s) => s.name.trim().toLowerCase() === name.toLowerCase());
      if (found) return prev.map((s) => (s.id === found.id ? { ...s, transactions: [tx, ...(s.transactions || [])] } : s));
      return [{ id: uid(), name, brands: [], representative: p.contact || "", email: "", phone: "", annualBudget: "", transactions: [tx], notes: "Criado automaticamente a partir da prospecção de campanha.", createdAt: nowIso() }, ...prev];
    });
    const updated = { ...p, aporteRegistrado: true, updatedAt: nowIso() };
    setProspects(prospects.map((x) => (x.id === p.id ? updated : x)));
    setProspectEditing(updated);
  }

  const addChecklistItem = () => {
    const t = checklistText.trim();
    if (!t) return;
    set("checklist", [...(data.checklist || []), { id: uid(), text: t, done: false }]);
    setChecklistText("");
  };
  const toggleChecklist = (id) => set("checklist", (data.checklist || []).map((c) => (c.id === id ? { ...c, done: !c.done } : c)));
  const removeChecklist = (id) => set("checklist", (data.checklist || []).filter((c) => c.id !== id));

  const addComment = () => {
    const t = commentText.trim();
    if (!t) return;
    set("comments", [{ id: uid(), text: t, author: username || "Anônimo", date: nowIso() }, ...(data.comments || [])]);
    setCommentText("");
  };

  const doneCount = (data.checklist || []).filter((c) => c.done).length;
  const total = (data.checklist || []).length;

  async function runAI() {
    setAiLoading(true); setAiError("");
    try {
      const suggestion = await suggestDemandWithAI(data, teamSuggestions);
      setData((d) => ({
        ...d,
        category: DEMAND_CATEGORIES.includes(suggestion.categoria) ? suggestion.categoria : d.category,
        priority: PRIORITIES.some((p) => p.key === suggestion.prioridade) ? suggestion.prioridade : d.priority,
        owner: suggestion.responsavel || d.owner,
        deadline: typeof suggestion.prazoDias === "number" ? nextDate(suggestion.prazoDias) : d.deadline,
        impact: IMPACTS.includes(suggestion.impacto) ? suggestion.impacto : d.impact,
        aiNote: suggestion.justificativa || "",
      }));
    } catch (e) {
      setAiError("Não foi possível obter uma sugestão agora. Classifique manualmente.");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="mkos-overlay" onClick={onClose}>
      <div className="mkos-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="mkos-drawer-head">
          <input className="mkos-title-input" placeholder={isProjects ? "Nome do projeto" : isCampaigns ? "Nome da campanha" : "Título da demanda"}
            value={data.name ?? data.title ?? ""} onChange={(e) => set(isDemands ? "title" : "name", e.target.value)} autoFocus />
          <button className="mkos-icon-btn" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="mkos-drawer-body">
          {isDemands ? (
            <>
              <Field label="Descrição" full><textarea className="mkos-input" rows={3} value={data.description || ""} onChange={(e) => set("description", e.target.value)} /></Field>
              <div className="mkos-grid2">
                <Field label="Canal de entrada">
                  <select className="mkos-select full" value={data.channel} onChange={(e) => set("channel", e.target.value)}>
                    {DEMAND_CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Solicitante"><input className="mkos-input" value={data.requester || ""} onChange={(e) => set("requester", e.target.value)} /></Field>
              </div>

              <div className="mkos-ai-box">
                <div className="flex items-center justify-between" style={{ marginBottom: aiError || data.aiNote ? 8 : 0 }}>
                  <div style={{ fontSize: 12, color: C.inkSoft, display: "flex", alignItems: "center", gap: 6 }}>
                    <Sparkles size={13} color={C.amber} /> A IA sugere categoria, prioridade, responsável e prazo
                  </div>
                  <button className="mkos-btn-secondary" onClick={runAI} disabled={aiLoading || !data.title}>
                    {aiLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />} Sugerir
                  </button>
                </div>
                {aiError && <div style={{ fontSize: 12, color: C.danger }}>{aiError}</div>}
                {data.aiNote && !aiError && <div style={{ fontSize: 12, color: C.inkSoft, fontStyle: "italic" }}>"{data.aiNote}"</div>}
              </div>

              <div className="mkos-grid2">
                <Field label="Status">
                  <select className="mkos-select full" value={data.status} onChange={(e) => set("status", e.target.value)}>
                    {DEMAND_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Categoria">
                  <select className="mkos-select full" value={data.category} onChange={(e) => set("category", e.target.value)}>
                    {DEMAND_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
              </div>
              <div className="mkos-grid2">
                <Field label="Prioridade">
                  <select className="mkos-select full" value={data.priority} onChange={(e) => set("priority", e.target.value)}>
                    {PRIORITIES.map((p) => <option key={p.key} value={p.key}>{p.key}</option>)}
                  </select>
                </Field>
                <Field label="Impacto">
                  <select className="mkos-select full" value={data.impact} onChange={(e) => set("impact", e.target.value)}>
                    {IMPACTS.map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                </Field>
              </div>
              <div className="mkos-grid2">
                <Field label="Responsável">
                  <input className="mkos-input" list="mkos-team-names" value={data.owner || ""} onChange={(e) => set("owner", e.target.value)} />
                  <datalist id="mkos-team-names">{teamSuggestions.map((s) => <option value={s} key={s} />)}</datalist>
                </Field>
                <Field label="Prazo"><input className="mkos-input" type="date" value={data.deadline || ""} onChange={(e) => set("deadline", e.target.value)} /></Field>
              </div>

              {(data.category === "Projeto" || data.category === "Campanha") && !data.linkedId && (
                <button className="mkos-btn-secondary" style={{ width: "100%", justifyContent: "center" }}
                  onClick={() => onPromote(data, data.category === "Projeto" ? "projects" : "campaigns")}>
                  <ArrowRight size={14} /> Transformar em {data.category === "Projeto" ? "projeto" : "campanha"}
                </button>
              )}
              {data.linkedId && <div style={{ fontSize: 12, color: C.teal }}>✓ Já transformada em {data.linkedType === "projects" ? "projeto" : "campanha"}.</div>}
            </>
          ) : (
            <>
              <Field label="Objetivo" full><input className="mkos-input" value={data.objective || ""} onChange={(e) => set("objective", e.target.value)} placeholder="Qual resultado esse trabalho precisa entregar?" /></Field>
              {isProjects && <Field label="Descrição" full><textarea className="mkos-input" rows={3} value={data.description || ""} onChange={(e) => set("description", e.target.value)} /></Field>}

              <div className="mkos-grid2">
                <Field label="Status">
                  <select className="mkos-select full" value={data.status} onChange={(e) => set("status", e.target.value)}>
                    {(isProjects ? PROJECT_STATUSES : CAMPAIGN_STATUSES).map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Prioridade">
                  <select className="mkos-select full" value={data.priority || "Média"} onChange={(e) => set("priority", e.target.value)}>
                    {PRIORITIES.map((p) => <option key={p.key} value={p.key}>{p.key}</option>)}
                  </select>
                </Field>
              </div>

              {isProjects ? (
                <div className="mkos-grid2">
                  <Field label="Categoria">
                    <select className="mkos-select full" value={data.category} onChange={(e) => set("category", e.target.value)}>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field label="Área">
                    <select className="mkos-select full" value={data.area} onChange={(e) => set("area", e.target.value)}>
                      {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </Field>
                </div>
              ) : (
                <Field label="Categorias" full><TagInput value={data.categories || []} onChange={(v) => set("categories", v)} placeholder="Ex: Elétrica — Enter para adicionar" suggestions={CATEGORIES} /></Field>
              )}

              <div className="mkos-grid2">
                <Field label="Fornecedor">
                  <input className="mkos-input" list="mkos-suppliers" value={data.supplier || ""} onChange={(e) => set("supplier", e.target.value)} />
                  <datalist id="mkos-suppliers">{supplierSuggestions.map((s) => <option value={s} key={s} />)}</datalist>
                </Field>
                {isProjects ? (
                  <Field label="Responsável">
                    <input className="mkos-input" list="mkos-team-names" value={data.owner || ""} onChange={(e) => set("owner", e.target.value)} />
                    <datalist id="mkos-team-names">{teamSuggestions.map((s) => <option value={s} key={s} />)}</datalist>
                  </Field>
                ) : (
                  <Field label="Produtos"><TagInput value={data.products || []} onChange={(v) => set("products", v)} placeholder="Produto — Enter" /></Field>
                )}
              </div>

              <Field label="Equipe" full><TagInput value={data.team || []} onChange={(v) => set("team", v)} placeholder="Nome — Enter para adicionar" suggestions={teamSuggestions} /></Field>

              {isProjects ? (
                <div className="mkos-grid2">
                  <Field label="Investimento (R$)"><input className="mkos-input" type="number" value={data.investment ?? ""} onChange={(e) => set("investment", e.target.value)} /></Field>
                  <Field label="Prazo"><input className="mkos-input" type="date" value={data.deadline || ""} onChange={(e) => set("deadline", e.target.value)} /></Field>
                </div>
              ) : (
                <>
                  <div className="mkos-grid2">
                    <Field label="Verba (R$)"><input className="mkos-input" type="number" value={data.budget ?? ""} onChange={(e) => set("budget", e.target.value)} /></Field>
                    <Field label="Investido até agora (R$)"><input className="mkos-input" type="number" value={data.budgetSpent ?? ""} onChange={(e) => set("budgetSpent", e.target.value)} /></Field>
                  </div>
                  <div className="mkos-grid2">
                    <Field label="Início"><input className="mkos-input" type="date" value={data.startDate || ""} onChange={(e) => set("startDate", e.target.value)} /></Field>
                    <Field label="Fim"><input className="mkos-input" type="date" value={data.endDate || ""} onChange={(e) => set("endDate", e.target.value)} /></Field>
                  </div>
                  <div className="mkos-grid2">
                    <Field label="ROI / resultado numérico"><input className="mkos-input" value={data.roi || ""} onChange={(e) => set("roi", e.target.value)} placeholder="Ex: 3.2x ou +18% vendas" /></Field>
                    <Field label="Materiais"><TagInput value={data.materials || []} onChange={(v) => set("materials", v)} placeholder="Material — Enter" /></Field>
                  </div>
                  <Field label="Resultados / aprendizados" full><textarea className="mkos-input" rows={2} value={data.results || ""} onChange={(e) => set("results", e.target.value)} /></Field>

                  <Field label={`Prospecção de fornecedores ${prospects.length ? `(${prospects.length})` : ""}`} full>
                    <div className="mkos-prospect-board">
                      {PROSPECT_STAGES.map((stage, colIdx) => (
                        <div key={stage} className="mkos-prospect-col">
                          <div className="mkos-prospect-col-head">{stage}<span>{(groupedProspects[stage] || []).length}</span></div>
                          {(groupedProspects[stage] || []).map((p) => (
                            <div key={p.id} className="mkos-prospect-card" onClick={() => setProspectEditing(p)}>
                              <div style={{ fontWeight: 600, fontSize: 12, color: C.ink, marginBottom: 3 }}>{p.supplier || "Sem nome"}</div>
                              {p.value !== "" && p.value != null && <div style={{ fontSize: 11, color: C.inkSoft, fontFamily: "'IBM Plex Mono', monospace" }}>{fmtMoney(p.value)}</div>}
                              <Pill style={{ marginTop: 4, fontSize: 9.5 }} color={PAYMENT_METHOD_COLOR[p.paymentMethod]}>{p.paymentMethod}</Pill>
                              <div className="mkos-prospect-move">
                                <button type="button" disabled={colIdx === 0} onClick={(e) => { e.stopPropagation(); moveProspectStage(p.id, PROSPECT_STAGES[colIdx - 1]); }} title="Mover para estágio anterior"><ChevronLeft size={12} /></button>
                                <button type="button" disabled={colIdx === PROSPECT_STAGES.length - 1} onClick={(e) => { e.stopPropagation(); moveProspectStage(p.id, PROSPECT_STAGES[colIdx + 1]); }} title="Mover para o próximo estágio"><ChevronRight size={12} /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                    <button className="mkos-btn-secondary" style={{ marginTop: 8 }} onClick={openNewProspect}><Plus size={14} /> Adicionar fornecedor à prospecção</button>
                  </Field>
                </>
              )}

              <Field label={`Checklist ${total ? `(${doneCount}/${total})` : ""}`} full>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
                  {(data.checklist || []).map((c) => (
                    <div key={c.id} className="mkos-checklist-item">
                      <button className={`mkos-check ${c.done ? "done" : ""}`} onClick={() => toggleChecklist(c.id)}>{c.done && <Check size={11} color="#fff" />}</button>
                      <span style={{ textDecoration: c.done ? "line-through" : "none", color: c.done ? C.inkFaint : C.ink, flex: 1, fontSize: 13 }}>{c.text}</span>
                      <Trash2 size={13} color={C.inkFaint} className="cursor-pointer" onClick={() => removeChecklist(c.id)} />
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <input className="mkos-input" placeholder="Adicionar item…" value={checklistText} onChange={(e) => setChecklistText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addChecklistItem()} />
                  <button className="mkos-btn-secondary" onClick={addChecklistItem}><Plus size={14} /></button>
                </div>
              </Field>
            </>
          )}

          <Field label="Comentários" full>
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              <input className="mkos-input" placeholder={username ? "Escreva um comentário…" : "Informe seu nome na barra lateral para comentar…"} value={commentText}
                onChange={(e) => setCommentText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addComment()} />
              <button className="mkos-btn-secondary" onClick={addComment}><MessageSquare size={14} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(data.comments || []).map((c) => (
                <div key={c.id} style={{ fontSize: 12.5, background: C.paper, border: `1px solid ${C.borderSoft}`, borderRadius: 8, padding: "8px 10px" }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: 3 }}>
                    <span style={{ fontWeight: 600, color: C.ink }}>{c.author}</span>
                    <span style={{ color: C.inkFaint, fontSize: 10.5, fontFamily: "'IBM Plex Mono', monospace" }}>{new Date(c.date).toLocaleDateString("pt-BR")}</span>
                  </div>
                  <div style={{ color: C.inkSoft }}>{c.text}</div>
                </div>
              ))}
            </div>
          </Field>
        </div>

        <div className="mkos-drawer-foot">
          <button className="mkos-btn-danger" onClick={() => onDelete(data.id)}><Trash2 size={14} /> Excluir</button>
          <div style={{ flex: 1 }} />
          <button className="mkos-btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="mkos-btn-primary" onClick={() => onSave(data)}><Check size={14} /> Salvar</button>
        </div>
      </div>

      {prospectEditing && (
        <ProspectEditor data={prospectEditing} supplierSuggestions={supplierSuggestions}
          onClose={() => setProspectEditing(null)} onSave={saveProspect} onDelete={deleteProspect} onRegisterAporte={registerAporte} />
      )}
    </div>
  );
}

function ProspectEditor({ data: initial, supplierSuggestions, onClose, onSave, onDelete, onRegisterAporte }) {
  const [p, setP] = useState(initial);
  const set = (k, v) => setP((d) => ({ ...d, [k]: v }));
  const canRegister = p.stage === "Termo Assinado" && Number(p.value) > 0 && p.supplier.trim();

  return (
    <div className="mkos-overlay mkos-overlay-top" onClick={(e) => { e.stopPropagation(); onClose(); }}>
      <div className="mkos-prospect-modal" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: C.ink }}>Fornecedor em prospecção</div>
          <button className="mkos-icon-btn" onClick={onClose}><X size={16} /></button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="Fornecedor">
            <input className="mkos-input" list="mkos-prospect-suppliers" value={p.supplier} onChange={(e) => set("supplier", e.target.value)} placeholder="Nome do fornecedor" autoFocus />
            <datalist id="mkos-prospect-suppliers">{supplierSuggestions.map((s) => <option value={s} key={s} />)}</datalist>
          </Field>
          <Field label="Contato / representante"><input className="mkos-input" value={p.contact || ""} onChange={(e) => set("contact", e.target.value)} /></Field>
          <div className="mkos-grid2">
            <Field label="Estágio">
              <select className="mkos-select full" value={p.stage} onChange={(e) => set("stage", e.target.value)}>
                {PROSPECT_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Valor acordado (R$)"><input className="mkos-input" type="number" value={p.value ?? ""} onChange={(e) => set("value", e.target.value)} /></Field>
          </div>
          <Field label="Forma de pagamento">
            <select className="mkos-select full" value={p.paymentMethod} onChange={(e) => set("paymentMethod", e.target.value)}>
              {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="Notas" full><textarea className="mkos-input" rows={3} value={p.notes || ""} onChange={(e) => set("notes", e.target.value)} /></Field>

          {p.stage === "Termo Assinado" && (
            <div className="mkos-ai-box">
              {p.aporteRegistrado ? (
                <div style={{ fontSize: 12, color: C.teal, display: "flex", alignItems: "center", gap: 6 }}><Check size={13} /> Aporte já registrado no fornecedor.</div>
              ) : (
                <>
                  <div style={{ fontSize: 12, color: C.inkSoft, marginBottom: 8 }}>Termo assinado — quer lançar esse valor como aporte na Verba Cooperada deste fornecedor?</div>
                  <button className="mkos-btn-secondary" disabled={!canRegister} onClick={() => onRegisterAporte(p)}><Wallet size={13} /> Registrar aporte no fornecedor</button>
                </>
              )}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button className="mkos-btn-danger" onClick={() => onDelete(p.id)}><Trash2 size={14} /> Excluir</button>
          <div style={{ flex: 1 }} />
          <button className="mkos-btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="mkos-btn-primary" onClick={() => onSave(p)}><Check size={14} /> Salvar</button>
        </div>
      </div>
    </div>
  );
}

/* ============================= VERBA COOPERADA (Fornecedores) ============================= */

function SuppliersView({ suppliers, setSuppliers, campaigns, onDelete }) {
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");

  const withMetrics = useMemo(() => suppliers.map((s) => {
    const linked = campaigns.filter((c) => c.supplier === s.name);
    const investedViaCampaigns = linked.reduce((a, c) => a + (Number(c.budgetSpent) || 0), 0);
    const aportes = (s.transactions || []).filter((t) => t.type === "Aporte recebido").reduce((a, t) => a + (Number(t.amount) || 0), 0);
    const investidoManual = (s.transactions || []).filter((t) => t.type === "Investimento em campanha").reduce((a, t) => a + (Number(t.amount) || 0), 0);
    const contrapartida = (s.transactions || []).filter((t) => t.type === "Contrapartida (material)").reduce((a, t) => a + (Number(t.amount) || 0), 0);
    const budget = Number(s.annualBudget) || 0;
    const totalInvestido = investidoManual + investedViaCampaigns;
    const saldo = budget + aportes - totalInvestido;
    const pct = budget > 0 ? (totalInvestido / budget) * 100 : 0;
    return { ...s, linked, investedViaCampaigns, aportes, investidoManual, contrapartida, totalInvestido, saldo, pct };
  }), [suppliers, campaigns]);

  const filtered = withMetrics.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

  const stats = useMemo(() => {
    const totalBudget = withMetrics.reduce((a, s) => a + (Number(s.annualBudget) || 0), 0);
    const totalInvestido = withMetrics.reduce((a, s) => a + s.totalInvestido, 0);
    const totalSaldo = withMetrics.reduce((a, s) => a + s.saldo, 0);
    const baixo = withMetrics.filter((s) => s.annualBudget > 0 && s.saldo / s.annualBudget < 0.15).length;
    return [
      { label: "Verba total anual", value: fmtMoney(totalBudget) },
      { label: "Investido", value: fmtMoney(totalInvestido) },
      { label: "Saldo disponível", value: fmtMoney(totalSaldo) },
      { label: "Fornecedores com saldo baixo", value: baixo, danger: baixo > 0 },
    ];
  }, [withMetrics]);

  function openNew() {
    setEditing({ id: uid(), name: "", brands: [], representative: "", email: "", phone: "", annualBudget: "", transactions: [], notes: "", createdAt: nowIso() });
  }

  return (
    <>
      <div className="mkos-stats">
        {stats.map((s) => (
          <div className="mkos-stat" key={s.label}>
            <div style={{ fontSize: 11, color: C.inkFaint, textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, color: s.danger ? C.danger : C.ink }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div className="mkos-toolbar">
        <div className="mkos-search"><Search size={13} color={C.inkFaint} /><input placeholder="Buscar fornecedor…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <div style={{ flex: 1 }} />
        <button className="mkos-btn-primary" onClick={openNew}><Plus size={14} /> Novo fornecedor</button>
      </div>
      <div className="mkos-scroll">
        <div className="mkos-supplier-grid">
          {filtered.map((s) => (
            <div key={s.id} className="mkos-card" onClick={() => setEditing(s)}>
              <div className="flex items-start justify-between" style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 7, background: C.paperDeep, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Building2 size={14} color={C.copper} />
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 13.5, color: C.ink }}>{s.name || "Sem nome"}</div>
                </div>
              </div>
              {(s.brands || []).length > 0 && <div style={{ fontSize: 11, color: C.inkFaint, marginBottom: 10 }}>{s.brands.join(", ")}</div>}
              <div className="flex items-center justify-between" style={{ fontSize: 10.5, color: C.inkFaint, marginBottom: 3, fontFamily: "'IBM Plex Mono', monospace" }}>
                <span>Investido {fmtMoney(s.totalInvestido)}</span><span>{fmtMoney(s.annualBudget)}</span>
              </div>
              <LoadBar pct={s.pct} />
              <div className="flex items-center justify-between" style={{ marginTop: 10 }}>
                <span style={{ fontSize: 11.5, color: s.saldo < 0 ? C.danger : C.inkSoft }}>Saldo: {fmtMoney(s.saldo)}</span>
                <span style={{ fontSize: 11, color: C.inkFaint }}>{s.linked.length} campanha{s.linked.length !== 1 ? "s" : ""}</span>
              </div>
            </div>
          ))}
        </div>
        {filtered.length === 0 && <div style={{ textAlign: "center", padding: "48px 0", color: C.inkFaint, fontSize: 13 }}>Nenhum fornecedor cadastrado ainda.</div>}
      </div>

      {editing && (
        <SupplierDrawer data={editing} onClose={() => setEditing(null)}
          onSave={(d) => { setSuppliers((prev) => (prev.some((x) => x.id === d.id) ? prev.map((x) => (x.id === d.id ? d : x)) : [d, ...prev])); setEditing(null); }}
          onDelete={() => { onDelete(editing.id); setEditing(null); }} linkedCampaigns={campaigns.filter((c) => c.supplier === editing.name)} />
      )}
    </>
  );
}

function SupplierDrawer({ data: initial, onClose, onSave, onDelete, linkedCampaigns }) {
  const [data, setData] = useState(initial);
  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));
  const [txDraft, setTxDraft] = useState({ type: TX_TYPES[0], description: "", amount: "", date: toISODate(new Date()) });

  const addTx = () => {
    if (!txDraft.description.trim() && !txDraft.amount) return;
    set("transactions", [{ id: uid(), ...txDraft, amount: Number(txDraft.amount) || 0 }, ...(data.transactions || [])]);
    setTxDraft({ type: TX_TYPES[0], description: "", amount: "", date: toISODate(new Date()) });
  };
  const removeTx = (id) => set("transactions", (data.transactions || []).filter((t) => t.id !== id));

  return (
    <div className="mkos-overlay" onClick={onClose}>
      <div className="mkos-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="mkos-drawer-head">
          <input className="mkos-title-input" placeholder="Nome do fornecedor" value={data.name} onChange={(e) => set("name", e.target.value)} autoFocus />
          <button className="mkos-icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="mkos-drawer-body">
          <Field label="Marcas" full><TagInput value={data.brands || []} onChange={(v) => set("brands", v)} placeholder="Marca — Enter" /></Field>
          <div className="mkos-grid2">
            <Field label="Representante"><input className="mkos-input" value={data.representative || ""} onChange={(e) => set("representative", e.target.value)} /></Field>
            <Field label="Verba anual (R$)"><input className="mkos-input" type="number" value={data.annualBudget ?? ""} onChange={(e) => set("annualBudget", e.target.value)} /></Field>
          </div>
          <div className="mkos-grid2">
            <Field label="E-mail"><input className="mkos-input" value={data.email || ""} onChange={(e) => set("email", e.target.value)} /></Field>
            <Field label="Telefone"><input className="mkos-input" value={data.phone || ""} onChange={(e) => set("phone", e.target.value)} /></Field>
          </div>

          {linkedCampaigns.length > 0 && (
            <Field label="Campanhas vinculadas" full>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {linkedCampaigns.map((c) => (
                  <div key={c.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, background: C.paper, border: `1px solid ${C.borderSoft}`, borderRadius: 8, padding: "7px 10px" }}>
                    <span style={{ color: C.ink }}>{c.name}</span>
                    <span style={{ color: C.inkFaint, fontFamily: "'IBM Plex Mono', monospace" }}>{fmtMoney(c.budgetSpent)}</span>
                  </div>
                ))}
              </div>
            </Field>
          )}

          <Field label="Lançamentos (verba cooperada)" full>
            <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
              <select className="mkos-select" value={txDraft.type} onChange={(e) => setTxDraft((d) => ({ ...d, type: e.target.value }))}>
                {TX_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <input className="mkos-input" style={{ flex: 1, minWidth: 120 }} placeholder="Descrição" value={txDraft.description} onChange={(e) => setTxDraft((d) => ({ ...d, description: e.target.value }))} />
              <input className="mkos-input" style={{ width: 110 }} type="number" placeholder="Valor" value={txDraft.amount} onChange={(e) => setTxDraft((d) => ({ ...d, amount: e.target.value }))} />
              <input className="mkos-input" style={{ width: 130 }} type="date" value={txDraft.date} onChange={(e) => setTxDraft((d) => ({ ...d, date: e.target.value }))} />
              <button className="mkos-btn-secondary" onClick={addTx}><Plus size={14} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {(data.transactions || []).map((t) => (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, background: C.paper, border: `1px solid ${C.borderSoft}`, borderRadius: 8, padding: "7px 10px" }}>
                  <Pill color={t.type === "Aporte recebido" ? C.teal : t.type === "Contrapartida (material)" ? C.amber : C.copper}>{t.type}</Pill>
                  <span style={{ flex: 1, color: C.ink }}>{t.description}</span>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: C.inkSoft }}>{fmtMoney(t.amount)}</span>
                  <span style={{ fontSize: 10.5, color: C.inkFaint }}>{fmtDate(t.date)}</span>
                  <Trash2 size={13} color={C.inkFaint} className="cursor-pointer" onClick={() => removeTx(t.id)} />
                </div>
              ))}
            </div>
          </Field>

          <Field label="Notas / pendências" full><textarea className="mkos-input" rows={3} value={data.notes || ""} onChange={(e) => set("notes", e.target.value)} /></Field>
        </div>
        <div className="mkos-drawer-foot">
          <button className="mkos-btn-danger" onClick={onDelete}><Trash2 size={14} /> Excluir</button>
          <div style={{ flex: 1 }} />
          <button className="mkos-btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="mkos-btn-primary" onClick={() => onSave(data)}><Check size={14} /> Salvar</button>
        </div>
      </div>
    </div>
  );
}

/* ============================= CALENDÁRIO MESTRE ============================= */

function CalendarView({ projects, campaigns, demands, events, setEvents, onOpenItem }) {
  const [month, setMonth] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [selectedDate, setSelectedDate] = useState(toISODate(new Date()));
  const [newEvent, setNewEvent] = useState({ title: "", type: EVENT_TYPES[0], description: "" });

  const itemsByDate = useMemo(() => {
    const map = {};
    const push = (date, entry) => { if (!date) return; if (!map[date]) map[date] = []; map[date].push(entry); };
    projects.forEach((p) => p.deadline && push(p.deadline, { label: p.name, color: C.copper, kind: "projects", ref: p }));
    campaigns.forEach((c) => {
      if (c.startDate) push(c.startDate, { label: `Início: ${c.name}`, color: C.teal, kind: "campaigns", ref: c });
      if (c.endDate) push(c.endDate, { label: `Fim: ${c.name}`, color: C.teal, kind: "campaigns", ref: c });
    });
    demands.forEach((d) => d.deadline && d.status !== "Concluída" && d.status !== "Descartada" && push(d.deadline, { label: d.title, color: C.danger, kind: "demands", ref: d }));
    events.forEach((e) => push(e.date, { label: e.title, color: EVENT_TYPE_COLOR[e.type] || C.indigo, kind: "event", ref: e }));
    return map;
  }, [projects, campaigns, demands, events]);

  const weeks = useMemo(() => {
    const first = new Date(month);
    const startWeekday = first.getDay();
    const gridStart = new Date(first);
    gridStart.setDate(1 - startWeekday);
    const days = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      days.push(d);
    }
    const rows = [];
    for (let i = 0; i < days.length; i += 7) rows.push(days.slice(i, i + 7));
    return rows;
  }, [month]);

  const monthLabel = month.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const todayISO = toISODate(new Date());

  const addEvent = () => {
    if (!newEvent.title.trim()) return;
    setEvents((prev) => [...prev, { id: uid(), title: newEvent.title, type: newEvent.type, description: newEvent.description, date: selectedDate }]);
    setNewEvent({ title: "", type: EVENT_TYPES[0], description: "" });
  };
  const removeEvent = (id) => setEvents((prev) => prev.filter((e) => e.id !== id));

  const selectedItems = itemsByDate[selectedDate] || [];

  return (
    <div className="mkos-scroll">
      <div className="mkos-cal-toolbar">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="mkos-icon-btn" onClick={() => setMonth((m) => { const d = new Date(m); d.setMonth(d.getMonth() - 1); return d; })}><ChevronLeft size={15} /></button>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: C.ink, textTransform: "capitalize", minWidth: 160, textAlign: "center" }}>{monthLabel}</div>
          <button className="mkos-icon-btn" onClick={() => setMonth((m) => { const d = new Date(m); d.setMonth(d.getMonth() + 1); return d; })}><ChevronRight size={15} /></button>
          <button className="mkos-btn-secondary" onClick={() => { const d = new Date(); d.setDate(1); setMonth(d); setSelectedDate(toISODate(new Date())); }}>Hoje</button>
        </div>
        <div className="mkos-cal-legend">
          <span><i style={{ background: C.copper }} /> Prazo de projeto</span>
          <span><i style={{ background: C.teal }} /> Campanha</span>
          <span><i style={{ background: C.danger }} /> Demanda</span>
          <span><i style={{ background: C.indigo }} /> Evento</span>
        </div>
      </div>

      <div className="mkos-cal-grid">
        {["dom", "seg", "ter", "qua", "qui", "sex", "sáb"].map((d) => <div key={d} className="mkos-cal-weekday">{d}</div>)}
        {weeks.map((week, wi) => week.map((day, di) => {
          const iso = toISODate(day);
          const inMonth = day.getMonth() === month.getMonth();
          const entries = itemsByDate[iso] || [];
          return (
            <div key={wi + "-" + di} className={`mkos-cal-day ${inMonth ? "" : "faded"} ${iso === selectedDate ? "selected" : ""} ${iso === todayISO ? "today" : ""}`}
              onClick={() => setSelectedDate(iso)}>
              <div className="mkos-cal-daynum">{day.getDate()}</div>
              <div className="mkos-cal-entries">
                {entries.slice(0, 3).map((e, i) => <div key={i} className="mkos-cal-entry" style={{ background: e.color + "22", color: e.color }}>{e.label}</div>)}
                {entries.length > 3 && <div className="mkos-cal-more">+{entries.length - 3} mais</div>}
              </div>
            </div>
          );
        }))}
      </div>

      <div className="mkos-cal-panel">
        <div style={{ fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: C.ink, marginBottom: 10 }}>
          {new Date(selectedDate + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
        </div>
        {selectedItems.length === 0 && <div style={{ fontSize: 12.5, color: C.inkFaint, marginBottom: 12 }}>Nada agendado neste dia.</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
          {selectedItems.map((e, i) => (
            <div key={i} className="mkos-cal-item-row">
              <span style={{ width: 8, height: 8, borderRadius: 99, background: e.color, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 13, color: C.ink, cursor: e.kind !== "event" ? "pointer" : "default" }}
                onClick={() => e.kind !== "event" && onOpenItem(e.kind, e.ref)}>{e.label}</span>
              {e.kind === "event" && <Trash2 size={13} color={C.inkFaint} className="cursor-pointer" onClick={() => removeEvent(e.ref.id)} />}
            </div>
          ))}
        </div>
        <div className="mkos-label">Adicionar evento neste dia</div>
        <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
          <input className="mkos-input" style={{ flex: 1, minWidth: 140 }} placeholder="Título do evento" value={newEvent.title} onChange={(e) => setNewEvent((n) => ({ ...n, title: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && addEvent()} />
          <select className="mkos-select" value={newEvent.type} onChange={(e) => setNewEvent((n) => ({ ...n, type: e.target.value }))}>
            {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <button className="mkos-btn-primary" onClick={addEvent}><Plus size={14} /> Adicionar</button>
        </div>
      </div>
    </div>
  );
}

/* ============================= EQUIPE ============================= */

function workloadFor(name, projects, campaigns, demands) {
  const items = [];
  projects.forEach((p) => { if (p.status !== "Concluído" && ((p.team || []).includes(name) || p.owner === name)) items.push({ label: p.name, type: "Projeto" }); });
  campaigns.forEach((c) => { if (c.status !== "Finalizada" && (c.team || []).includes(name)) items.push({ label: c.name, type: "Campanha" }); });
  demands.forEach((d) => { if (d.status !== "Concluída" && d.status !== "Descartada" && d.owner === name) items.push({ label: d.title, type: "Demanda" }); });
  return items;
}

function TeamView({ team, setTeam, projects, campaigns, demands, username, onDelete }) {
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");

  const withWorkload = useMemo(() => team.map((m) => {
    const load = workloadFor(m.name, projects, campaigns, demands);
    const level = load.length >= 6 ? "danger" : load.length >= 3 ? "amber" : "teal";
    return { ...m, load, level };
  }), [team, projects, campaigns, demands]);

  const filtered = withWorkload.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));
  const overloaded = withWorkload.filter((m) => m.level === "danger").length;
  const totalLoad = withWorkload.reduce((a, m) => a + m.load.length, 0);

  const stats = [
    { label: "Pessoas na equipe", value: team.length },
    { label: "Itens ativos no time", value: totalLoad },
    { label: "Sobrecarregados", value: overloaded, danger: overloaded > 0 },
  ];

  function openNew() { setEditing({ id: uid(), name: "", role: "", email: "", phone: "", skills: [], vacationStart: "", vacationEnd: "", goals: "", feedbacks: [], createdAt: nowIso() }); }

  return (
    <>
      <div className="mkos-stats" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        {stats.map((s) => (
          <div className="mkos-stat" key={s.label}>
            <div style={{ fontSize: 11, color: C.inkFaint, textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, color: s.danger ? C.danger : C.ink }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div className="mkos-toolbar">
        <div className="mkos-search"><Search size={13} color={C.inkFaint} /><input placeholder="Buscar pessoa…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <div style={{ flex: 1 }} />
        <button className="mkos-btn-primary" onClick={openNew}><UserPlus size={14} /> Novo membro</button>
      </div>
      <div className="mkos-scroll">
        <div className="mkos-supplier-grid">
          {filtered.map((m) => (
            <div key={m.id} className="mkos-card" onClick={() => setEditing(m)}>
              <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
                <Avatar name={m.name} size={34} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5, color: C.ink }}>{m.name || "Sem nome"}</div>
                  <div style={{ fontSize: 11.5, color: C.inkFaint }}>{m.role}</div>
                </div>
              </div>
              {(m.skills || []).length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
                  {m.skills.slice(0, 3).map((s) => <Pill key={s} style={{ fontSize: 10.5 }}>{s}</Pill>)}
                </div>
              )}
              <div className="flex items-center justify-between">
                <Pill color={m.level === "danger" ? C.danger : m.level === "amber" ? C.amber : C.teal} soft={m.level === "danger" ? C.dangerSoft : m.level === "amber" ? C.amberSoft : C.tealSoft}>
                  {m.load.length} ativo{m.load.length !== 1 ? "s" : ""}
                </Pill>
                {m.email && <span style={{ fontSize: 11, color: C.inkFaint, display: "flex", alignItems: "center", gap: 3 }}><Mail size={11} /></span>}
              </div>
            </div>
          ))}
        </div>
        {filtered.length === 0 && <div style={{ textAlign: "center", padding: "48px 0", color: C.inkFaint, fontSize: 13 }}>Nenhum membro cadastrado ainda.</div>}
      </div>

      {editing && (
        <TeamDrawer data={editing} onClose={() => setEditing(null)} username={username}
          onSave={(d) => { setTeam((prev) => (prev.some((x) => x.id === d.id) ? prev.map((x) => (x.id === d.id ? d : x)) : [d, ...prev])); setEditing(null); }}
          onDelete={() => { onDelete(editing.id); setEditing(null); }} load={workloadFor(editing.name, projects, campaigns, demands)} />
      )}
    </>
  );
}

function TeamDrawer({ data: initial, onClose, onSave, onDelete, load, username }) {
  const [data, setData] = useState(initial);
  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));
  const [fbText, setFbText] = useState("");
  const addFeedback = () => {
    const t = fbText.trim();
    if (!t) return;
    set("feedbacks", [{ id: uid(), text: t, author: username || "Anônimo", date: nowIso() }, ...(data.feedbacks || [])]);
    setFbText("");
  };

  return (
    <div className="mkos-overlay" onClick={onClose}>
      <div className="mkos-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="mkos-drawer-head">
          <input className="mkos-title-input" placeholder="Nome" value={data.name} onChange={(e) => set("name", e.target.value)} autoFocus />
          <button className="mkos-icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="mkos-drawer-body">
          <div className="mkos-grid2">
            <Field label="Cargo"><input className="mkos-input" value={data.role || ""} onChange={(e) => set("role", e.target.value)} /></Field>
            <Field label="E-mail"><input className="mkos-input" value={data.email || ""} onChange={(e) => set("email", e.target.value)} /></Field>
          </div>
          <Field label="Telefone"><input className="mkos-input" value={data.phone || ""} onChange={(e) => set("phone", e.target.value)} /></Field>
          <Field label="Competências" full><TagInput value={data.skills || []} onChange={(v) => set("skills", v)} placeholder="Competência — Enter" /></Field>
          <div className="mkos-grid2">
            <Field label="Férias — início"><input className="mkos-input" type="date" value={data.vacationStart || ""} onChange={(e) => set("vacationStart", e.target.value)} /></Field>
            <Field label="Férias — fim"><input className="mkos-input" type="date" value={data.vacationEnd || ""} onChange={(e) => set("vacationEnd", e.target.value)} /></Field>
          </div>
          <Field label="Metas / desenvolvimento" full><textarea className="mkos-input" rows={3} value={data.goals || ""} onChange={(e) => set("goals", e.target.value)} /></Field>

          <Field label={`Carga de trabalho atual (${load.length})`} full>
            {load.length === 0 ? <div style={{ fontSize: 12.5, color: C.inkFaint }}>Nenhum item ativo atribuído.</div> : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {load.map((l, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, background: C.paper, border: `1px solid ${C.borderSoft}`, borderRadius: 8, padding: "6px 10px" }}>
                    <span style={{ color: C.ink }}>{l.label}</span><Pill style={{ fontSize: 10.5 }}>{l.type}</Pill>
                  </div>
                ))}
              </div>
            )}
          </Field>

          <Field label="Feedbacks" full>
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              <input className="mkos-input" placeholder="Registrar feedback…" value={fbText} onChange={(e) => setFbText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addFeedback()} />
              <button className="mkos-btn-secondary" onClick={addFeedback}><MessageSquare size={14} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(data.feedbacks || []).map((c) => (
                <div key={c.id} style={{ fontSize: 12.5, background: C.paper, border: `1px solid ${C.borderSoft}`, borderRadius: 8, padding: "8px 10px" }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: 3 }}>
                    <span style={{ fontWeight: 600, color: C.ink }}>{c.author}</span>
                    <span style={{ color: C.inkFaint, fontSize: 10.5, fontFamily: "'IBM Plex Mono', monospace" }}>{new Date(c.date).toLocaleDateString("pt-BR")}</span>
                  </div>
                  <div style={{ color: C.inkSoft }}>{c.text}</div>
                </div>
              ))}
            </div>
          </Field>
        </div>
        <div className="mkos-drawer-foot">
          <button className="mkos-btn-danger" onClick={onDelete}><Trash2 size={14} /> Excluir</button>
          <div style={{ flex: 1 }} />
          <button className="mkos-btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="mkos-btn-primary" onClick={() => onSave(data)}><Check size={14} /> Salvar</button>
        </div>
      </div>
    </div>
  );
}

/* ============================= GLOBAL STYLE ============================= */

function GlobalStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');

      .mkos-root, .mkos-root * { font-family: 'Inter', sans-serif; box-sizing: border-box; }
      .mkos-root button { cursor: pointer; font-family: 'Inter', sans-serif; }
      .mkos-root input, .mkos-root select, .mkos-root textarea { font-family: 'Inter', sans-serif; }
      .mkos-shell { min-height: 640px; }

      .mkos-sidebar { width: 200px; flex-shrink: 0; background: ${C.surface}; border-right: 1px solid ${C.border}; display: flex; flex-direction: column; padding: 16px 12px; }
      .mkos-brand { display: flex; align-items: center; gap: 8px; padding: 0 4px 16px 4px; margin-bottom: 6px; border-bottom: 1px solid ${C.borderSoft}; }
      .mkos-brand-icon { width: 28px; height: 28px; border-radius: 7px; background: ${C.copper}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
      .mkos-brand-title { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 14px; color: ${C.ink}; line-height: 1.1; }
      .mkos-brand-sub { font-size: 10.5px; color: ${C.inkFaint}; font-family: 'IBM Plex Mono', monospace; }
      .mkos-nav { display: flex; flex-direction: column; gap: 2px; flex: 1; margin-top: 8px; }
      .mkos-nav-item { display: flex; align-items: center; gap: 9px; padding: 8px 10px; border-radius: 7px; border: none; font-size: 12.5px; font-weight: 600; text-align: left; }
      .mkos-nav-item:hover { background: ${C.paperDeep}; }
      .mkos-sidebar-foot { border-top: 1px solid ${C.borderSoft}; padding-top: 12px; display: flex; flex-direction: column; gap: 8px; }
      .mkos-username { border: 1px solid ${C.border}; background: ${C.surface}; border-radius: 7px; padding: 6px 9px; font-size: 12px; width: 100%; color: ${C.ink}; }
      .mkos-sync { font-size: 10.5px; color: ${C.inkFaint}; font-family: 'IBM Plex Mono', monospace; display: flex; align-items: center; gap: 4px; }

      .mkos-main { flex: 1; display: flex; flex-direction: column; padding: 18px 20px; min-width: 0; min-height: 0; }
      .mkos-scroll { flex: 1; overflow-y: auto; }

      .mkos-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: ${C.border}; margin-bottom: 14px; border: 1px solid ${C.border}; border-radius: 8px; overflow: hidden; }
      .mkos-stat { background: ${C.surface}; padding: 11px 14px; }

      .mkos-toolbar { display: flex; gap: 8px; align-items: center; margin-bottom: 14px; flex-wrap: wrap; }
      .mkos-icon-btn { border: 1px solid ${C.border}; background: transparent; border-radius: 6px; padding: 5px; display: flex; align-items: center; justify-content: center; color: ${C.inkSoft}; }
      .mkos-icon-btn:hover { background: ${C.paperDeep}; }
      .mkos-icon-btn:disabled { opacity: 0.5; cursor: not-allowed; }

      .mkos-search { display: flex; align-items: center; gap: 6px; background: ${C.surface}; border: 1px solid ${C.border}; border-radius: 7px; padding: 6px 10px; min-width: 190px; }
      .mkos-search input { border: none; outline: none; background: transparent; font-size: 12.5px; width: 100%; color: ${C.ink}; }

      .mkos-select { border: 1px solid ${C.border}; background: ${C.surface}; border-radius: 7px; padding: 6px 10px; font-size: 12.5px; color: ${C.ink}; }
      .mkos-select.full { width: 100%; }

      .mkos-btn-primary { display: flex; align-items: center; gap: 6px; background: ${C.copper}; color: #fff; border: none; border-radius: 7px; padding: 8px 14px; font-size: 12.5px; font-weight: 600; }
      .mkos-btn-primary:hover { background: ${C.copperDeep}; }
      .mkos-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
      .mkos-btn-secondary { display: flex; align-items: center; gap: 6px; background: ${C.surface}; color: ${C.ink}; border: 1px solid ${C.border}; border-radius: 7px; padding: 8px 14px; font-size: 12.5px; font-weight: 600; }
      .mkos-btn-secondary:hover { background: ${C.paperDeep}; }
      .mkos-btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }
      .mkos-btn-danger { display: flex; align-items: center; gap: 6px; background: transparent; color: ${C.danger}; border: 1px solid ${C.dangerSoft}; border-radius: 7px; padding: 8px 14px; font-size: 12.5px; font-weight: 600; }
      .mkos-btn-danger:hover { background: ${C.dangerSoft}; }

      .mkos-column { background: ${C.paperDeep}; border-radius: 10px; padding: 10px; width: 250px; flex-shrink: 0; min-height: 100px; }
      .mkos-column-head { display: flex; align-items: center; justify-content: space-between; font-size: 12px; font-weight: 700; color: ${C.inkSoft}; text-transform: uppercase; letter-spacing: 0.03em; padding: 2px 4px 10px 4px; }
      .mkos-column-count { background: ${C.surface}; border-radius: 20px; padding: 1px 7px; font-size: 11px; color: ${C.inkFaint}; }

      .mkos-card { background: ${C.surface}; border: 1px solid ${C.borderSoft}; border-radius: 9px; padding: 12px; cursor: pointer; transition: box-shadow .15s ease, transform .1s ease; }
      .mkos-card:hover { box-shadow: 0 3px 10px rgba(32,36,30,0.08); transform: translateY(-1px); }

      .mkos-supplier-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 10px; }

      .mkos-table-wrap { background: ${C.surface}; border: 1px solid ${C.border}; border-radius: 10px; overflow: hidden; }
      .mkos-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
      .mkos-table th { text-align: left; padding: 10px 14px; color: ${C.inkFaint}; font-size: 11px; text-transform: uppercase; letter-spacing: 0.03em; border-bottom: 1px solid ${C.border}; background: ${C.paper}; }
      .mkos-table td { padding: 10px 14px; border-bottom: 1px solid ${C.borderSoft}; color: ${C.inkSoft}; }
      .mkos-table tr:hover td { background: ${C.paper}; cursor: pointer; }
      .mkos-table tr:last-child td { border-bottom: none; }

      .mkos-overlay { position: fixed; inset: 0; background: rgba(32,36,30,0.45); display: flex; justify-content: flex-end; z-index: 50; animation: mkos-fade .15s ease; }
      @keyframes mkos-fade { from { opacity: 0; } to { opacity: 1; } }
      .mkos-drawer { background: ${C.paper}; width: min(540px, 92vw); height: 100%; display: flex; flex-direction: column; box-shadow: -8px 0 30px rgba(0,0,0,0.15); }
      .mkos-drawer-head { display: flex; align-items: center; gap: 8px; padding: 16px 18px; border-bottom: 1px solid ${C.border}; background: ${C.surface}; }
      .mkos-title-input { flex: 1; border: none; background: transparent; outline: none; font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 17px; color: ${C.ink}; }
      .mkos-drawer-body { flex: 1; overflow-y: auto; padding: 16px 18px; display: flex; flex-direction: column; gap: 14px; }
      .mkos-drawer-foot { display: flex; align-items: center; gap: 8px; padding: 14px 18px; border-top: 1px solid ${C.border}; background: ${C.surface}; }

      .mkos-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      .mkos-label { font-size: 11px; font-weight: 600; color: ${C.inkFaint}; text-transform: uppercase; letter-spacing: 0.03em; margin-bottom: 5px; }
      .mkos-input { width: 100%; border: 1px solid ${C.border}; background: ${C.surface}; border-radius: 7px; padding: 8px 10px; font-size: 13px; color: ${C.ink}; outline: none; }
      .mkos-input:focus { border-color: ${C.copper}; }

      .mkos-checklist-item { display: flex; align-items: center; gap: 8px; padding: 4px 2px; }
      .mkos-check { width: 17px; height: 17px; border-radius: 5px; border: 1.5px solid ${C.border}; background: ${C.surface}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
      .mkos-check.done { background: ${C.teal}; border-color: ${C.teal}; }

      .mkos-confirm { background: ${C.surface}; border-radius: 12px; padding: 20px; width: 300px; margin: auto; align-self: center; }

      .mkos-ai-box { background: ${C.yellowSoft}; border: 1px solid ${C.border}; border-radius: 9px; padding: 10px 12px; }

      .mkos-prospect-board { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; }
      .mkos-prospect-col { background: ${C.paperDeep}; border-radius: 8px; padding: 8px; width: 140px; flex-shrink: 0; min-height: 60px; }
      .mkos-prospect-col-head { display: flex; align-items: center; justify-content: space-between; font-size: 9.5px; font-weight: 700; color: ${C.inkSoft}; text-transform: uppercase; letter-spacing: 0.02em; margin-bottom: 6px; }
      .mkos-prospect-col-head span { background: ${C.surface}; border-radius: 20px; padding: 0 5px; }
      .mkos-prospect-card { background: ${C.surface}; border: 1px solid ${C.borderSoft}; border-radius: 7px; padding: 7px 8px; margin-bottom: 6px; cursor: pointer; }
      .mkos-prospect-card:hover { border-color: ${C.copper}; }
      .mkos-prospect-move { display: flex; justify-content: space-between; margin-top: 6px; }
      .mkos-prospect-move button { border: 1px solid ${C.border}; background: ${C.paper}; border-radius: 5px; padding: 2px 5px; display: flex; align-items: center; color: ${C.inkSoft}; }
      .mkos-prospect-move button:hover:not(:disabled) { background: ${C.copperSoft}; color: ${C.copper}; border-color: ${C.copper}; }
      .mkos-prospect-move button:disabled { opacity: 0.35; cursor: not-allowed; }

      .mkos-overlay-top { z-index: 60; }
      .mkos-prospect-modal { background: ${C.surface}; border-radius: 12px; padding: 20px; width: min(420px, 90vw); margin: auto; align-self: center; max-height: 88vh; overflow-y: auto; }

      .mkos-cal-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; flex-wrap: wrap; gap: 8px; }
      .mkos-cal-legend { display: flex; gap: 12px; font-size: 11px; color: ${C.inkFaint}; flex-wrap: wrap; }
      .mkos-cal-legend span { display: flex; align-items: center; gap: 5px; }
      .mkos-cal-legend i { width: 8px; height: 8px; border-radius: 99px; display: inline-block; }
      .mkos-cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin-bottom: 16px; }
      .mkos-cal-weekday { font-size: 10.5px; color: ${C.inkFaint}; text-transform: uppercase; text-align: center; padding: 4px 0; font-weight: 700; }
      .mkos-cal-day { background: ${C.surface}; border: 1px solid ${C.borderSoft}; border-radius: 8px; padding: 6px; min-height: 74px; cursor: pointer; display: flex; flex-direction: column; gap: 3px; }
      .mkos-cal-day:hover { border-color: ${C.copper}; }
      .mkos-cal-day.faded { opacity: 0.4; }
      .mkos-cal-day.selected { border-color: ${C.copper}; box-shadow: 0 0 0 1px ${C.copper} inset; }
      .mkos-cal-day.today .mkos-cal-daynum { color: ${C.copper}; font-weight: 700; }
      .mkos-cal-daynum { font-size: 11.5px; color: ${C.ink}; font-family: 'IBM Plex Mono', monospace; }
      .mkos-cal-entries { display: flex; flex-direction: column; gap: 2px; }
      .mkos-cal-entry { font-size: 9.5px; padding: 1px 4px; border-radius: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .mkos-cal-more { font-size: 9px; color: ${C.inkFaint}; padding-left: 2px; }
      .mkos-cal-panel { background: ${C.surface}; border: 1px solid ${C.border}; border-radius: 10px; padding: 16px; }
      .mkos-cal-item-row { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid ${C.borderSoft}; }
      .mkos-cal-item-row:last-child { border-bottom: none; }

      @media (max-width: 900px) {
        .mkos-shell { flex-direction: column; }
        .mkos-sidebar { width: 100%; flex-direction: row; align-items: center; overflow-x: auto; border-right: none; border-bottom: 1px solid ${C.border}; padding: 10px 12px; }
        .mkos-brand { border-bottom: none; padding: 0 10px; margin-bottom: 0; }
        .mkos-nav { flex-direction: row; margin-top: 0; }
        .mkos-nav-item span { display: none; }
        .mkos-sidebar-foot { flex-direction: row; border-top: none; padding-top: 0; margin-left: auto; }
        .mkos-username { width: 90px; }
        .mkos-stats { grid-template-columns: repeat(2, 1fr); }
        .mkos-grid2 { grid-template-columns: 1fr; }
        .mkos-cal-grid { gap: 2px; }
        .mkos-cal-day { min-height: 54px; padding: 4px; }
      }
    `}</style>
  );
}
