import { formatNumber } from "@/lib/reports";

// Barras horizontais de uma cor (magnitude): valor na ponta, % do total ao lado
export default function BarList({ items }) {
  const max = Math.max(...items.map((i) => i.value || 0), 1);
  const total = items.reduce((a, i) => a + (i.value || 0), 0) || 1;
  return (
    <div className="space-y-3.5">
      {items.map((item) => (
        <div key={item.label} title={`${item.label}: ${formatNumber(item.value, { compact: false })}`}>
          <div className="mb-1 flex items-baseline justify-between text-sm">
            <span className="font-medium text-ink-soft">{item.label}</span>
            <span>
              <b>{formatNumber(item.value)}</b>
              <span className="ml-1.5 text-xs text-ink-mute">{Math.round(((item.value || 0) / total) * 100)}%</span>
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-brand-soft">
            <div className="h-3 rounded-full bg-brand" style={{ width: `${Math.max(2, ((item.value || 0) / max) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
