import Logo from "./Logo";
import { HeartMascot, Spark, Star, Sticker } from "./brand";

const TILT = [-5, 3, -2, 5, -3, 2, -4, 4, -2];
function Big({ text, offset = 0 }) {
  return text.split("").map((ch, i) => (
    <span key={i} className="inline-block" style={{ transform: `rotate(${TILT[(i + offset) % TILT.length]}deg)` }}>{ch}</span>
  ));
}

export default function AuthCard({ title, subtitle, children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <Logo className="mb-10" />
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-brand">{title}</h1>
          {subtitle && <p className="mb-8 mt-2 text-sm text-ink-soft">{subtitle}</p>}
          {children}
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-brand lg:flex lg:flex-col lg:justify-center lg:px-14">
        {/* padrão de fundo */}
        <div className="pointer-events-none absolute inset-0 opacity-[.07]" style={{ backgroundImage: "radial-gradient(#FFF4E1 1.5px, transparent 1.5px)", backgroundSize: "22px 22px" }} />
        <Star size={34} className="absolute left-14 top-16 rotate-12" />
        <Star size={22} className="absolute bottom-24 right-20 -rotate-12" color="#FF573C" stroke="#FFF4E1" />

        <div className="relative">
          <div className="flex items-start">
            <div className="font-display text-[clamp(64px,7.5vw,112px)] font-extrabold uppercase leading-[.82] tracking-tight text-cream">
              <div><Big text="POST" /></div>
              <div><Big text="LOVER" offset={4} /></div>
            </div>
            <div className="relative -ml-2 -mt-4">
              <Spark size={36} className="absolute -right-6 -top-4" />
              <HeartMascot size={120} fill="#FFF4E1" stroke="#082B87" className="drop-shadow-[0_0_0_#FFF4E1]" />
            </div>
          </div>

          <p className="mt-8 max-w-md text-xl font-medium leading-snug text-cream">
            Gerencie, crie e publique suas postagens nas redes sociais.
          </p>
          <svg viewBox="0 0 220 14" className="mt-1 h-3 w-56" aria-hidden="true">
            <path d="M3 9 C60 3 140 3 217 8" stroke="#F8D85C" strokeWidth="5" fill="none" strokeLinecap="round" />
          </svg>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Sticker color="coral" rotate={-8}>Novo</Sticker>
            <Sticker color="butter" rotate={4}>Agende</Sticker>
            <Sticker color="cream" rotate={-3}>Publique</Sticker>
          </div>

          <p className="mt-10 max-w-md text-sm text-cream/75">
            O cliente aprova e o conteúdo é <span className="font-semibold text-butter">agendado automaticamente</span>. Chega de briefing no WhatsApp e print de conversa.
          </p>
        </div>
      </div>
    </div>
  );
}
