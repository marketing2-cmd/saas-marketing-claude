"use client";

import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";

// Chave "Rascunho / Visível para o cliente" de uma seção do planejamento
export default function VisibilityToggle({ shared, onChange, dirty }) {
  const [busy, setBusy] = useState(false);
  async function toggle(next) {
    if (next === shared) return;
    if (dirty && !confirm("Liberar agora também salva as outras alterações não salvas. Continuar?")) return;
    setBusy(true);
    await onChange(next);
    setBusy(false);
  }
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3">
      <div className="flex items-center gap-2 text-sm">
        {shared ? <Eye size={16} className="text-emerald-600" /> : <EyeOff size={16} className="text-ink-mute" />}
        <span className="font-semibold">{shared ? "Visível para o cliente" : "Rascunho"}</span>
        <span className="hidden text-ink-mute sm:inline">{shared ? "— aparece no link de aprovação dele." : "— só a sua equipe vê."}</span>
      </div>
      <div className="flex rounded-xl border border-line bg-paper p-1 text-xs font-semibold" role="radiogroup" aria-label="Visibilidade da seção">
        {busy && <Loader2 size={14} className="mx-2 my-auto animate-spin text-ink-mute" />}
        <button role="radio" aria-checked={!shared} onClick={() => toggle(false)} disabled={busy} className={`rounded-lg px-3 py-1.5 transition ${!shared ? "bg-white text-ink shadow-sm" : "text-ink-mute hover:text-ink"}`}>Rascunho</button>
        <button role="radio" aria-checked={shared} onClick={() => toggle(true)} disabled={busy} className={`rounded-lg px-3 py-1.5 transition ${shared ? "bg-emerald-600 text-white shadow-sm" : "text-ink-mute hover:text-ink"}`}>Visível para o cliente</button>
      </div>
    </div>
  );
}
