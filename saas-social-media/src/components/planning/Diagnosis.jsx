"use client";

import { SectionHeader, TextArea } from "./fields";

const SWOT = [
  { key: "strengths", label: "Forças", hint: "O que o perfil já faz bem", tone: "bg-emerald-50 ring-emerald-100", dot: "bg-emerald-500" },
  { key: "weaknesses", label: "Fraquezas", hint: "O que precisa melhorar", tone: "bg-rose-50 ring-rose-100", dot: "bg-rose-500" },
  { key: "opportunities", label: "Oportunidades", hint: "O que dá para aproveitar", tone: "bg-sky-50 ring-sky-100", dot: "bg-sky-500" },
  { key: "threats", label: "Ameaças", hint: "Riscos de fora", tone: "bg-amber-50 ring-amber-100", dot: "bg-amber-500" },
];

export default function Diagnosis({ strategy, update }) {
  const d = strategy.diagnosis || {};
  const set = (patch) => update((s) => ({ diagnosis: { ...(s.diagnosis || {}), ...patch } }));

  return (
    <div className="space-y-5 pb-24">
      <SectionHeader title="Diagnóstico" description="Como o perfil está hoje: o ponto de partida do trabalho." />
      <div className="card grid gap-4 p-5 md:grid-cols-2">
        <TextArea label="Resumo do diagnóstico" rows={5} value={d.summary} onChange={(v) => set({ summary: v })} placeholder="Ex.: perfil bonito, mas com pouca frequência e quase nenhum vídeo…" />
        <TextArea label="Situação atual (números)" rows={5} value={d.current_situation} onChange={(v) => set({ current_situation: v })} placeholder="Ex.: 8 mil seguidores, 2 posts por semana, alcance médio de 1,5 mil…" hint="Dica: os números atualizados estão em Relatórios." />
      </div>
      <div>
        <h3 className="mb-3 font-bold">Análise SWOT</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {SWOT.map((q) => (
            <div key={q.key} className={`rounded-2xl p-4 ring-1 ${q.tone}`}>
              <div className="mb-2 flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${q.dot}`} />
                <span className="font-bold">{q.label}</span>
                <span className="text-xs text-ink-mute">· {q.hint}</span>
              </div>
              <textarea className="input resize-y bg-white" rows={5} placeholder="Um item por linha" value={d[q.key] || ""} onChange={(e) => set({ [q.key]: e.target.value })} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
