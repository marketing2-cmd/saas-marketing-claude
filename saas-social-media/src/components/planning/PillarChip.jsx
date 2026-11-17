export default function PillarChip({ pillar, className = "" }) {
  if (!pillar) return null;
  return (
    <span className={`chip bg-white text-ink-soft ring-1 ring-line ${className}`}>
      <span className="h-2 w-2 rounded-full" style={{ background: pillar.color }} />
      {pillar.name || "Sem nome"}
    </span>
  );
}
