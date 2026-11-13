import Logo from "./Logo";

export default function AuthCard({ title, subtitle, children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <Logo className="mb-10" />
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="mb-8 mt-2 text-sm text-ink-soft">{subtitle}</p>}
          {children}
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-navy lg:flex lg:flex-col lg:justify-center lg:px-16">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand/40 blur-3xl" />
        <div className="absolute -bottom-40 left-10 h-96 w-96 rounded-full bg-[#F2557A]/20 blur-3xl" />
        <div className="relative">
          <div className="mb-6 flex flex-wrap gap-2">
            {["Aprovação de conteúdo", "Calendário", "Agendamento automático"].map((t) => (
              <span key={t} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">{t}</span>
            ))}
          </div>
          <h2 className="max-w-md text-3xl font-bold leading-tight text-white">
            O cliente aprova e o conteúdo é <span className="text-[#B9A6FF]">agendado automaticamente.</span>
          </h2>
          <p className="mt-4 max-w-md text-white/60">Chega de briefing no WhatsApp, print de conversa e planilha perdida. Tudo num lugar só.</p>
          <div className="mt-10 grid max-w-md grid-cols-4 gap-2 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
            {[["5", "Rascunho", "#94A3B8"], ["10", "Aprovação", "#F5A524"], ["4", "Ajuste", "#F2557A"], ["12", "Aprovado", "#22B07D"]].map(([n, l, c]) => (
              <div key={l} className="text-center">
                <div className="text-2xl font-bold" style={{ color: c }}>{n}</div>
                <div className="text-[11px] text-white/60">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
