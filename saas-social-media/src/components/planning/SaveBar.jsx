"use client";

import { Loader2 } from "lucide-react";

// Barra fixa no rodapé quando há alterações não salvas
export default function SaveBar({ dirty, saving, onSave, onDiscard }) {
  if (!dirty) return null;
  return (
    <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 lg:pl-[264px]">
      <div className="flex w-full max-w-xl items-center justify-between gap-3 rounded-2xl bg-navy px-4 py-3 text-sm text-white shadow-float">
        <span className="font-medium">Você tem alterações não salvas.</span>
        <div className="flex gap-2">
          <button onClick={onDiscard} disabled={saving} className="btn px-3 py-1.5 text-white/80 hover:bg-white/10">Descartar</button>
          <button onClick={onSave} disabled={saving} className="btn bg-brand px-4 py-1.5 text-white hover:bg-brand-dark">
            {saving && <Loader2 size={14} className="animate-spin" />} Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
