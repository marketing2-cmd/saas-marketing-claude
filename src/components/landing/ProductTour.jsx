"use client";

import { useState } from "react";
import { Home, LayoutList, Kanban, FileText, MessageCircle } from "lucide-react";

const SHOTS = [
  { id: "home", label: "Meu dia", icon: Home, src: "/landing/app-home.webp", alt: "Tela inicial com tarefas e rotina do dia" },
  { id: "list", label: "Lista", icon: LayoutList, src: "/landing/app-list.webp", alt: "Projeto em lista agrupada por status" },
  { id: "board", label: "Quadro", icon: Kanban, src: "/landing/app-board.webp", alt: "Projeto em quadro kanban" },
  { id: "atas", label: "Atas", icon: FileText, src: "/landing/app-atas.webp", alt: "Ata de reunião com encaminhamentos" },
  { id: "chat", label: "Chat", icon: MessageCircle, src: "/landing/app-chat.webp", alt: "Chat interno conectado ao Google Chat" },
];

export default function ProductTour() {
  const [cur, setCur] = useState("home");
  return (
    <div>
      <div className="mb-5 flex flex-wrap justify-center gap-2">
        {SHOTS.map((s) => (
          <button
            key={s.id}
            onClick={() => setCur(s.id)}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
              cur === s.id ? "border-brand bg-brand text-white" : "border-line bg-surface/60 text-ink-2 hover:border-line-strong hover:text-ink"
            }`}
          >
            <s.icon size={15} /> {s.label}
          </button>
        ))}
      </div>
      <div className="relative">
        <div className="pointer-events-none absolute -inset-x-10 -bottom-10 top-10 rounded-[40px] bg-brand/25 blur-3xl" />
        <div className="relative overflow-hidden rounded-2xl border border-line-strong bg-surface shadow-glow">
          <div className="flex items-center gap-1.5 border-b border-line bg-[#161615] px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
            <span className="ml-3 hidden rounded-md bg-hover px-3 py-0.5 text-xs text-muted sm:block">app.spacemais</span>
          </div>
          <div className="relative aspect-[1440/900] w-full bg-canvas">
            {SHOTS.map((s) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={s.id}
                src={s.src}
                alt={s.alt}
                loading={s.id === "home" ? "eager" : "lazy"}
                className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-500 ${cur === s.id ? "opacity-100" : "opacity-0"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
