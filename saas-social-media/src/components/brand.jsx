// Elementos de marca Post Lover desenhados em SVG (provisórios até chegarem os arquivos oficiais)

// Mascote: coração com rosto, braços e pernas, contorno marcante
export function HeartMascot({ size = 64, className = "", mood = "happy", fill = "#FFF4E1", stroke = "#082B87" }) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className={className} aria-hidden="true">
      <g fill="none" stroke={stroke} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
        {/* pernas */}
        <path d="M48 96 L44 110 M44 110 h-9" />
        <path d="M72 96 L76 110 M76 110 h9" />
        {/* braços */}
        <path d="M22 58 C12 56 8 48 12 42" />
        <path d="M98 58 C108 54 110 44 104 38" />
        {/* coração */}
        <path
          d="M60 100 C36 84 16 68 16 46 C16 31 27 21 40 21 C49 21 56 26 60 34 C64 26 71 21 80 21 C93 21 104 31 104 46 C104 68 84 84 60 100 Z"
          fill={fill}
        />
        {/* rosto */}
        {mood === "wink" ? (
          <>
            <path d="M43 50 q5 -6 10 0" />
            <path d="M67 48 h10" />
          </>
        ) : (
          <>
            <path d="M43 50 q5 -6 10 0" />
            <path d="M67 50 q5 -6 10 0" />
          </>
        )}
        <path d="M48 62 q12 12 24 0" fill={stroke} />
      </g>
      <circle cx="40" cy="60" r="4" fill="#FF573C" opacity=".55" />
      <circle cx="80" cy="60" r="4" fill="#FF573C" opacity=".55" />
    </svg>
  );
}

export function Star({ size = 22, className = "", color = "#F8D85C", stroke = "#082B87" }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
      <path d="M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.2 1.3-6.6L2.5 9.3l6.6-.8z" fill={color} stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

// Três risquinhos de "brilho" (como no lettering)
export function Spark({ size = 26, className = "", color = "#F8D85C" }) {
  return (
    <svg viewBox="0 0 30 30" width={size} height={size} className={className} aria-hidden="true">
      <g stroke={color} strokeWidth="3.2" strokeLinecap="round">
        <path d="M4 18 L11 16" />
        <path d="M7 7 L13 12" />
        <path d="M17 3 L17 10" />
      </g>
    </svg>
  );
}

// Sticker inclinado (NOVO, AGENDE, PUBLIQUE…)
export function Sticker({ children, color = "coral", rotate = -6, className = "" }) {
  const tone = color === "coral" ? "bg-coral text-cream" : color === "butter" ? "bg-butter text-brand" : "bg-cream text-brand";
  return (
    <span className={`inline-block rounded-full border-[2.5px] border-brand px-3 py-1 font-display text-sm font-extrabold uppercase tracking-wide shadow-sticker ${tone} ${className}`} style={{ transform: `rotate(${rotate}deg)` }}>
      {children}
    </span>
  );
}
