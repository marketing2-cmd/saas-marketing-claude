import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { delta, formatNumber, formatPercent } from "@/lib/reports";

// Cartão de métrica: rótulo, valor, variação vs período anterior
export default function StatTile({ label, help, value, previous, percent = false, downIsGood = false, highlight = false }) {
  const d = percent ? (value !== null && previous !== null && previous !== undefined ? value - previous : null) : delta(value, previous);
  const up = d !== null && d > 0.05;
  const down = d !== null && d < -0.05;
  const good = downIsGood ? down : up;
  const bad = downIsGood ? up : down;
  const Icon = up ? ArrowUpRight : down ? ArrowDownRight : Minus;

  return (
    <div className={`card p-4 ${highlight ? "ring-1 ring-brand-ring" : ""}`} title={help}>
      <div className="text-xs font-semibold text-ink-soft">{label}</div>
      <div className="mt-1.5 text-2xl font-bold tracking-tight">{percent ? formatPercent(value) : formatNumber(value)}</div>
      <div className={`mt-1 flex flex-wrap items-center gap-x-1 text-xs font-semibold ${good ? "text-emerald-600" : bad ? "text-rose-600" : "text-ink-mute"}`}>
        {d === null ? (
          <span className="font-medium text-ink-mute">sem comparação</span>
        ) : (
          <>
            <Icon size={14} />
            {percent ? `${d > 0 ? "+" : ""}${d.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} p.p.` : `${d > 0 ? "+" : ""}${d.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`}
            <span className="font-medium text-ink-mute"><span className="sm:hidden">vs. anterior</span><span className="hidden sm:inline">vs. período anterior</span></span>
          </>
        )}
      </div>
    </div>
  );
}
