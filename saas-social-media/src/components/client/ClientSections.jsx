"use client";

import { Bot, CalendarRange, FileText, Lightbulb, Package, Stethoscope, Swords, Target, UserRound } from "lucide-react";

export const SECTIONS = [
  { key: "content", label: "Conteúdo", icon: FileText },
  { key: "diagnosis", label: "Diagnóstico", icon: Stethoscope },
  { key: "persona", label: "Persona", icon: UserRound },
  { key: "competitors", label: "Concorrência", icon: Swords },
  { key: "positioning", label: "Posicionamento", icon: Target },
  { key: "products", label: "Produtos", icon: Package },
  { key: "schedule", label: "Cronograma", icon: CalendarRange },
  { key: "ideas", label: "Ideias", icon: Lightbulb },
  { key: "ai", label: "IA", icon: Bot, soon: true },
];

// Botões grandes de seção (rolam na horizontal no celular)
export default function ClientSections({ value, onChange }) {
  return (
    <nav className="-mx-4 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0" aria-label="Seções do cliente">
      <div className="grid min-w-[880px] grid-cols-9 gap-2.5">
        {SECTIONS.map(({ key, label, icon: Icon, soon }) => {
          const active = value === key;
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              aria-current={active ? "page" : undefined}
              className={`relative flex h-[84px] flex-col items-center justify-center gap-2 rounded-2xl border text-xs font-semibold transition active:scale-[0.97] ${
                active ? "border-brand bg-brand text-white shadow-[0_8px_20px_-8px_rgba(124,92,252,.7)]" : "border-line bg-white text-ink-soft hover:border-brand-ring hover:text-ink"
              }`}
            >
              <Icon size={19} />
              {label}
              {soon && <span className={`absolute right-2 top-2 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${active ? "bg-white/20" : "bg-paper text-ink-mute"}`}>em breve</span>}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
