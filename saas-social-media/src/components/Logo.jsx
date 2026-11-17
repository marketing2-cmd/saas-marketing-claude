import { HeartMascot } from "./brand";

// Logo provisório Post Lover: lettering em Bricolage ExtraBold com letras
// levemente giradas (efeito "feito à mão") + coração mascote.
// Troque por <img src="/brand/logo.svg"> quando chegarem os arquivos oficiais.
const TILT = [-4, 3, -2, 4, -3, 2, -4, 3, -2, 3];

function Lettering({ text, offset = 0 }) {
  return text.split("").map((ch, i) => (
    <span key={i} className="inline-block" style={{ transform: `rotate(${TILT[(i + offset) % TILT.length]}deg)` }}>
      {ch}
    </span>
  ));
}

export default function Logo({ className = "", light = false, size = "md", stacked = false }) {
  const color = light ? "text-cream" : "text-brand";
  const text = size === "lg" ? "text-5xl" : size === "sm" ? "text-base" : "text-[19px]";
  const icon = size === "lg" ? 84 : size === "sm" ? 26 : 34;
  return (
    <div className={`flex items-center gap-1.5 ${className}`} aria-label="Post Lover">
      <HeartMascot size={icon} fill={light ? "#FFF4E1" : "#FFF4E1"} stroke={light ? "#FFF4E1" : "#082B87"} />
      <span className={`font-display font-extrabold uppercase leading-[.85] tracking-tight ${color} ${text} ${stacked ? "flex flex-col" : ""}`}>
        {stacked ? (
          <>
            <span><Lettering text="POST" /></span>
            <span><Lettering text="LOVER" offset={4} /></span>
          </>
        ) : (
          <>
            <Lettering text="POST" /> <Lettering text="LOVER" offset={4} />
          </>
        )}
      </span>
    </div>
  );
}
