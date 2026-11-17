// Barra segmentada (uma parte do todo): segmentos separados por 2px de respiro,
// legenda com contagem sempre visível (a cor nunca é a única pista)
export default function SegmentedBar({ title, segments }) {
  const total = segments.reduce((a, s) => a + s.value, 0);
  return (
    <div className="card p-5">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-sm font-bold">{title}</h3>
        <span className="text-xs text-ink-mute">{total} conteúdos</span>
      </div>
      <div className="flex h-3 w-full gap-[2px] overflow-hidden rounded-full bg-paper" role="img" aria-label={`${title}: ${segments.map((s) => `${s.label} ${s.value}`).join(", ")}`}>
        {total > 0 &&
          segments.filter((s) => s.value > 0).map((s) => (
            <div key={s.label} className="h-full first:rounded-l-full last:rounded-r-full" style={{ width: `${(s.value / total) * 100}%`, background: s.color }} title={`${s.label}: ${s.value}`} />
          ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {segments.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5 text-xs text-ink-soft">
            <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
            {s.label}: <b className="text-ink">{s.value}</b>
          </span>
        ))}
      </div>
    </div>
  );
}
