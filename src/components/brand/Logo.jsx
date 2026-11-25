// Marca SpaceMais: dois paralelogramos laranja formando um "S" + wordmark.
export function LogoMark({ size = 28, color = "#FF6A00", className }) {
  return (
    <svg width={size} height={size * 0.8} viewBox="0 0 100 80" className={className} aria-hidden>
      <path fill={color} d="M33 0h67L86 26H57l-7 12H16L33 0z" />
      <path fill={color} d="M50 42h34L67 80H0l14-26h29l7-12z" />
    </svg>
  );
}

export function Logo({ size = 28, className = "", textClass = "text-[19px]", tone = "light" }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      <span
        className={`font-display leading-none tracking-tight ${textClass}`}
        style={{ fontFamily: "Sora, Inter, sans-serif", color: tone === "light" ? "#F6F6F6" : "#1D1D1B" }}
      >
        <span className="font-normal">Space</span>
        <span className="font-bold">Mais</span>
      </span>
    </span>
  );
}
