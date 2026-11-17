"use client";

import { Ban, Check, Plus, Target, Trash2, Users, Volume2 } from "lucide-react";
import { PILLAR_COLORS, uid } from "@/lib/planning";

function Field({ icon: Icon, title, hint, value, onChange, rows = 4, placeholder }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-brand"><Icon size={16} /></span>
        <div>
          <h3 className="font-bold leading-tight">{title}</h3>
          {hint && <p className="text-xs text-ink-mute">{hint}</p>}
        </div>
      </div>
      <textarea className="input mt-3 resize-y" rows={rows} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export default function EditorialLine({ strategy, update }) {
  const pillars = strategy.pillars || [];
  const total = pillars.reduce((a, p) => a + (Number(p.share) || 0), 0);

  function setPillar(id, patch) {
    update((s) => ({ pillars: s.pillars.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
  }
  function addPillar() {
    const color = PILLAR_COLORS[pillars.length % PILLAR_COLORS.length];
    update((s) => ({ pillars: [...s.pillars, { id: uid(), name: "", description: "", color, share: 0 }] }));
  }
  function removePillar(id) {
    const used = (strategy.weekly_schedule || []).some((slot) => slot.pillar_id === id);
    if (used && !confirm("Este pilar está no cronograma semanal. Remover mesmo assim?")) return;
    update((s) => ({
      pillars: s.pillars.filter((p) => p.id !== id),
      weekly_schedule: (s.weekly_schedule || []).map((slot) => (slot.pillar_id === id ? { ...slot, pillar_id: null } : slot)),
    }));
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="grid gap-4 lg:grid-cols-3">
        <Field icon={Target} title="Objetivos" hint="O que o perfil precisa alcançar" value={strategy.goals} onChange={(v) => update({ goals: v })} placeholder="Ex.: gerar pedidos pelo direct, ser referência no bairro…" />
        <Field icon={Users} title="Público-alvo" hint="Para quem falamos" value={strategy.audience} onChange={(v) => update({ audience: v })} placeholder="Ex.: mulheres de 25 a 45 anos, que compram para presentear…" />
        <Field icon={Volume2} title="Tom de voz" hint="Como a marca fala" value={strategy.tone} onChange={(v) => update({ tone: v })} placeholder="Ex.: leve, divertido, próximo; emojis com moderação…" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-5">
          <h3 className="flex items-center gap-2 font-bold"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600"><Check size={15} /></span> Pode / sempre fazer</h3>
          <textarea className="input mt-3 resize-y" rows={5} value={strategy.dos} placeholder={"Um item por linha\nEx.: fotos com luz natural"} onChange={(e) => update({ dos: e.target.value })} />
        </div>
        <div className="card p-5">
          <h3 className="flex items-center gap-2 font-bold"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-600"><Ban size={15} /></span> Evitar</h3>
          <textarea className="input mt-3 resize-y" rows={5} value={strategy.donts} placeholder={"Um item por linha\nEx.: falar de preço nos stories"} onChange={(e) => update({ donts: e.target.value })} />
        </div>
      </div>

      <section className="card p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="font-bold">Pilares de conteúdo</h3>
            <p className="text-sm text-ink-soft">Os temas fixos do perfil e quanto do conteúdo cada um deve ocupar.</p>
          </div>
          <button onClick={addPillar} className="btn-ghost px-3 py-2"><Plus size={16} /> Adicionar pilar</button>
        </div>

        {pillars.length > 0 && (
          <div className="mt-4">
            <div className="flex h-3 w-full gap-[2px] overflow-hidden rounded-full bg-paper" aria-hidden>
              {pillars.filter((p) => Number(p.share) > 0).map((p) => (
                <div key={p.id} style={{ width: `${(Number(p.share) / Math.max(total, 100)) * 100}%`, background: p.color }} />
              ))}
            </div>
            <p className={`mt-1.5 text-xs font-medium ${total === 100 ? "text-emerald-600" : "text-amber-600"}`}>
              Total: {total}% {total === 100 ? "✓" : total < 100 ? `— faltam ${100 - total}% para fechar 100%` : `— passou ${total - 100}% de 100%`}
            </p>
          </div>
        )}

        <div className="mt-4 space-y-3">
          {pillars.length === 0 && (
            <button onClick={addPillar} className="w-full rounded-2xl border-2 border-dashed border-line p-8 text-sm text-ink-mute hover:border-brand-ring hover:text-brand">
              Nenhum pilar ainda. Clique para criar o primeiro (ex.: Produto, Bastidores, Educativo).
            </button>
          )}
          {pillars.map((p) => (
            <div key={p.id} className="grid gap-3 rounded-2xl border border-line p-3 sm:grid-cols-[auto_1fr_2fr_96px_auto] sm:items-center">
              <div className="flex gap-1" role="radiogroup" aria-label="Cor do pilar">
                {PILLAR_COLORS.slice(0, 6).map((c) => (
                  <button key={c} type="button" onClick={() => setPillar(p.id, { color: c })} aria-label={`Cor ${c}`} className={`h-5 w-5 rounded-full ring-offset-2 ${p.color === c ? "ring-2 ring-ink" : ""}`} style={{ background: c }} />
                ))}
              </div>
              <input className="input" placeholder="Nome do pilar" value={p.name} onChange={(e) => setPillar(p.id, { name: e.target.value })} />
              <input className="input" placeholder="Descrição: que tipo de conteúdo entra aqui" value={p.description} onChange={(e) => setPillar(p.id, { description: e.target.value })} />
              <div className="relative">
                <input className="input pr-7 text-right" type="number" min="0" max="100" value={p.share} onChange={(e) => setPillar(p.id, { share: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })} aria-label="Meta em %" />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-mute">%</span>
              </div>
              <button onClick={() => removePillar(p.id)} className="btn justify-self-end px-2.5 py-2 text-rose-600 hover:bg-rose-50" aria-label="Remover pilar"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
