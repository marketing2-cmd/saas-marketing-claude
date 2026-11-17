"use client";

import { Ban, Check, ExternalLink, Flag, Package, Quote, UserRound } from "lucide-react";
import { FORMATS } from "@/lib/posts";
import { WEEKDAYS, monthLabel, sortSlots } from "@/lib/planning";
import { formatBRL } from "@/lib/clients";

// Seções do planejamento em modo leitura (portal do cliente)

const lines = (t) => (t || "").split("\n").map((l) => l.trim()).filter(Boolean);

function Block({ title, children, tone = "" }) {
  return (
    <section className={`rounded-2xl border border-line bg-white p-5 ${tone}`}>
      {title && <h3 className="mb-2 font-bold">{title}</h3>}
      {children}
    </section>
  );
}

function Text({ value, empty = "—" }) {
  return value ? <p className="whitespace-pre-wrap text-sm text-ink-soft">{value}</p> : <p className="text-sm text-ink-mute">{empty}</p>;
}

function List({ value, icon: Icon, color }) {
  const items = lines(value);
  if (!items.length) return <p className="text-sm text-ink-mute">—</p>;
  return (
    <ul className="space-y-1.5">
      {items.map((l, i) => (
        <li key={i} className="flex gap-2 text-sm">
          {Icon ? <Icon size={15} className={`mt-0.5 shrink-0 ${color}`} /> : <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${color}`} />}
          <span className="text-ink-soft">{l}</span>
        </li>
      ))}
    </ul>
  );
}

export function DiagnosisView({ data }) {
  const swot = [
    ["Forças", data.strengths, "bg-emerald-50", "bg-emerald-500"],
    ["Fraquezas", data.weaknesses, "bg-rose-50", "bg-rose-500"],
    ["Oportunidades", data.opportunities, "bg-sky-50", "bg-sky-500"],
    ["Ameaças", data.threats, "bg-amber-50", "bg-amber-500"],
  ];
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Block title="Resumo"><Text value={data.summary} /></Block>
        <Block title="Situação atual"><Text value={data.current_situation} /></Block>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {swot.map(([t, v, bg, dot]) => (
          <Block key={t} title={t} tone={bg}><List value={v} color={dot} /></Block>
        ))}
      </div>
    </div>
  );
}

export function PersonasView({ items }) {
  if (!items.length) return <Block><Text value="" empty="Nenhuma persona ainda." /></Block>;
  return (
    <div className="space-y-4">
      {items.map((p) => (
        <Block key={p.id}>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-soft text-brand"><UserRound size={20} /></span>
            <div>
              <div className="font-bold">{p.name || "Persona"}</div>
              <div className="text-xs text-ink-mute">{[p.age, p.occupation].filter(Boolean).join(" · ")}</div>
            </div>
          </div>
          {p.quote && <p className="mt-3 flex gap-2 rounded-xl bg-paper px-3 py-2 text-sm italic text-ink-soft"><Quote size={15} className="mt-0.5 shrink-0 text-brand" />{p.quote}</p>}
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div><div className="label">Dores</div><Text value={p.pains} /></div>
            <div><div className="label">Desejos</div><Text value={p.desires} /></div>
            <div><div className="label">Objeções</div><Text value={p.objections} /></div>
          </div>
          {p.channels && <p className="mt-3 text-xs text-ink-mute">Onde consome conteúdo: <b className="text-ink-soft">{p.channels}</b></p>}
        </Block>
      ))}
    </div>
  );
}

export function CompetitorsView({ items }) {
  if (!items.length) return <Block><Text value="" empty="Nenhum concorrente mapeado." /></Block>;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((c) => {
        const link = c.link || (c.handle ? `https://instagram.com/${c.handle.replace(/^@/, "")}` : null);
        return (
          <Block key={c.id}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-bold">{c.name || "Concorrente"}</div>
                {c.handle && <div className="text-xs text-ink-mute">{c.handle}</div>}
              </div>
              {link && <a href={link} target="_blank" rel="noreferrer" className="text-brand" aria-label="Abrir perfil"><ExternalLink size={16} /></a>}
            </div>
            <div className="mt-3 space-y-3">
              <div><div className="label">Pontos fortes</div><Text value={c.strengths} /></div>
              <div><div className="label">Pontos fracos</div><Text value={c.weaknesses} /></div>
              {c.notes && <div><div className="label">Observações</div><Text value={c.notes} /></div>}
            </div>
          </Block>
        );
      })}
    </div>
  );
}

export function PositioningView({ data }) {
  const pillars = data.pillars || [];
  return (
    <div className="space-y-4">
      <Block title="Proposta de valor"><Text value={data.value_proposition} /></Block>
      <div className="grid gap-4 sm:grid-cols-3">
        <Block title="Objetivos"><Text value={data.goals} /></Block>
        <Block title="Público-alvo"><Text value={data.audience} /></Block>
        <Block title="Tom de voz"><Text value={data.tone} /></Block>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Block title="Diferenciais"><List value={data.differentials} color="bg-brand" /></Block>
        <Block title="Sempre fazer"><List value={data.dos} icon={Check} color="text-emerald-600" /></Block>
        <Block title="Evitar"><List value={data.donts} icon={Ban} color="text-rose-600" /></Block>
      </div>
      {pillars.length > 0 && (
        <Block title="Pilares de conteúdo">
          <div className="mb-3 flex h-3 w-full gap-[2px] overflow-hidden rounded-full bg-paper">
            {pillars.filter((p) => Number(p.share) > 0).map((p) => <div key={p.id} style={{ width: `${p.share}%`, background: p.color }} />)}
          </div>
          <div className="space-y-2">
            {pillars.map((p) => (
              <div key={p.id} className="flex items-start gap-2 text-sm">
                <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: p.color }} />
                <span className="flex-1"><b>{p.name}</b> {p.description && <span className="text-ink-soft">— {p.description}</span>}</span>
                {Number(p.share) > 0 && <span className="text-xs font-semibold text-ink-mute">{p.share}%</span>}
              </div>
            ))}
          </div>
        </Block>
      )}
    </div>
  );
}

export function ProductsView({ items }) {
  if (!items.length) return <Block><Text value="" empty="Nenhum produto cadastrado." /></Block>;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((p) => (
        <Block key={p.id}>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand"><Package size={18} /></span>
            <div className="min-w-0 flex-1">
              <div className="font-bold">{p.name || "Produto"}</div>
              {p.price != null && <div className="text-sm font-semibold text-brand">{formatBRL(p.price)}</div>}
            </div>
          </div>
          {p.description && <p className="mt-3 text-sm text-ink-soft">{p.description}</p>}
          {p.differential && <p className="mt-2 text-xs"><b>Diferencial:</b> <span className="text-ink-soft">{p.differential}</span></p>}
          {p.link && <a href={p.link} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"><ExternalLink size={12} /> Link de venda</a>}
        </Block>
      ))}
    </div>
  );
}

export function ScheduleView({ data }) {
  const pillarById = Object.fromEntries((data.pillars || []).map((p) => [p.id, p]));
  return (
    <div className="space-y-4">
      <Block title="Rotina semanal de publicação">
        {data.weekly.length === 0 ? (
          <Text value="" empty="Ainda não definida." />
        ) : (
          <div className="divide-y divide-line">
            {WEEKDAYS.map((d) => {
              const slots = sortSlots(data.weekly.filter((s) => s.weekday === d.n));
              if (!slots.length) return null;
              return (
                <div key={d.n} className="flex gap-4 py-2.5">
                  <div className="w-20 shrink-0 text-sm font-semibold">{d.long}</div>
                  <div className="flex flex-1 flex-wrap gap-2">
                    {slots.map((s) => (
                      <span key={s.id} className="chip bg-paper text-ink-soft ring-1 ring-line">
                        {pillarById[s.pillar_id] && <span className="h-2 w-2 rounded-full" style={{ background: pillarById[s.pillar_id].color }} />}
                        {s.time} · {FORMATS[s.format]}{pillarById[s.pillar_id] ? ` · ${pillarById[s.pillar_id].name}` : ""}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Block>
      {data.monthly.map((m) => (
        <Block key={m.month} title={monthLabel(m.month)}>
          {m.theme && <p className="text-sm"><b>Tema:</b> <span className="text-ink-soft">{m.theme}</span></p>}
          {m.goals && <p className="mt-1 whitespace-pre-wrap text-sm"><b>Objetivos:</b> <span className="text-ink-soft">{m.goals}</span></p>}
          {(m.weeks || []).some(Boolean) && (
            <div className="mt-3 space-y-1 text-sm">
              {m.weeks.map((w, i) => w && <div key={i}><b className="text-ink-mute">Semana {i + 1}:</b> <span className="text-ink-soft">{w}</span></div>)}
            </div>
          )}
          {(m.key_dates || []).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {[...m.key_dates].sort((a, b) => a.date.localeCompare(b.date)).map((d) => (
                <span key={d.id} className="chip bg-brand-soft text-brand"><Flag size={11} />{new Date(`${d.date}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} · {d.title}</span>
              ))}
            </div>
          )}
        </Block>
      ))}
    </div>
  );
}
