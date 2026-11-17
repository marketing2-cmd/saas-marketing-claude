import { Bot, Lightbulb, PenLine, Sparkles } from "lucide-react";

export default function AiSoon() {
  return (
    <div className="card relative overflow-hidden p-8 text-center sm:p-12">
      <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand/15 blur-3xl" />
      <div className="relative mx-auto max-w-lg">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-white shadow-float"><Bot size={26} /></span>
        <h2 className="mt-4 text-xl font-bold">Assistente de IA — em breve</h2>
        <p className="mt-2 text-sm text-ink-soft">Vai usar o diagnóstico, a persona, o posicionamento e os produtos deste cliente para criar conteúdo no tom certo.</p>
        <div className="mt-6 grid gap-3 text-left sm:grid-cols-3">
          {[[PenLine, "Legendas", "No tom de voz do cliente"], [Lightbulb, "Ideias de pauta", "Pelos pilares e datas do mês"], [Sparkles, "Roteiros", "Para Reels e carrosséis"]].map(([Icon, t, d]) => (
            <div key={t} className="rounded-2xl bg-paper p-4">
              <Icon size={18} className="text-brand" />
              <div className="mt-2 text-sm font-bold">{t}</div>
              <div className="text-xs text-ink-mute">{d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
