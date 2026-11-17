// Dados comerciais do cliente: contrato, financeiro, nicho e serviços

export const CONTRACT_STATUSES = {
  active: { label: "Ativo", color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  negotiation: { label: "Em negociação", color: "bg-amber-100 text-amber-700", dot: "bg-amber-400" },
  paused: { label: "Pausado", color: "bg-slate-100 text-slate-600", dot: "bg-slate-400" },
  ended: { label: "Encerrado", color: "bg-rose-100 text-rose-600", dot: "bg-rose-500" },
};

export const SERVICES = [
  "Gestão de redes sociais",
  "Feed",
  "Stories",
  "Reels",
  "Design",
  "Copywriting",
  "Tráfego pago",
  "Captação de foto/vídeo",
  "Relatórios",
  "Atendimento de direct",
];

export const NICHES = [
  "Alimentação",
  "Gastronomia",
  "Saúde",
  "Odontologia",
  "Estética e beleza",
  "Moda",
  "Fitness",
  "Educação",
  "Imobiliário",
  "Advocacia",
  "Contabilidade",
  "Pet",
  "Varejo",
  "Serviços",
  "Tecnologia",
  "Turismo",
  "Eventos",
  "Arquitetura",
];

export const PAYMENT_METHODS = ["Pix", "Boleto", "Cartão de crédito", "Transferência", "Dinheiro"];

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export function formatBRL(value) {
  if (value === null || value === undefined || value === "") return "—";
  return brl.format(Number(value));
}

export function formatDate(iso) {
  if (!iso) return "—";
  return new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR");
}

// Dias até o fim do contrato (negativo = vencido)
export function daysUntil(iso) {
  if (!iso) return null;
  const end = new Date(`${iso}T23:59:59`);
  return Math.ceil((end - Date.now()) / 86400000);
}

export function whatsappLink(phone) {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits.length <= 11 ? `55${digits}` : digits}`;
}
