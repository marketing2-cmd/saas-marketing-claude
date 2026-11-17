"use client";

import { Gem, Sparkles } from "lucide-react";
import EditorialLine from "./EditorialLine";
import { SectionHeader } from "./fields";

export default function Positioning({ strategy, update }) {
  return (
    <div>
      <SectionHeader title="Posicionamento" description="Como a marca quer ser percebida e a linha editorial que sustenta isso." />
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <div className="card p-5">
          <h3 className="flex items-center gap-2 font-bold"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-brand"><Sparkles size={16} /></span> Proposta de valor</h3>
          <textarea className="input mt-3 resize-y" rows={4} value={strategy.value_proposition || ""} placeholder="Em uma frase: o que a marca entrega e para quem." onChange={(e) => update({ value_proposition: e.target.value })} />
        </div>
        <div className="card p-5">
          <h3 className="flex items-center gap-2 font-bold"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-brand"><Gem size={16} /></span> Diferenciais</h3>
          <textarea className="input mt-3 resize-y" rows={4} value={strategy.differentials || ""} placeholder="Um por linha" onChange={(e) => update({ differentials: e.target.value })} />
        </div>
      </div>
      <EditorialLine strategy={strategy} update={update} />
    </div>
  );
}
