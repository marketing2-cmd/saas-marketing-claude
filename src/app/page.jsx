import {
  ArrowRight, CalendarCheck2, LayoutList, ArrowRightLeft, FileText, Repeat, MessageCircle,
  MessageSquareWarning, NotebookPen, Puzzle, Sparkles, Smartphone, Zap, ShieldCheck, Plus, MousePointerClick,
} from "lucide-react";
import { Logo, LogoMark } from "@/components/brand/Logo";
import ProductTour from "@/components/landing/ProductTour";

export const metadata = {
  title: "SpaceMais — Gestão de projetos, rotina e atas num lugar só",
  description:
    "O SpaceMais junta projetos, rotinas, atas de reunião, pedidos entre setores e chat da sua equipe — simples de adotar desde o primeiro dia.",
};

const DEMO = "/app";

function Glow() {
  // Linhas de luz laranja da identidade visual (puro SVG + gradientes, sem imagem).
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute -left-40 -top-40 h-[620px] w-[620px] rounded-full bg-brand/30 blur-[140px]" />
      <div className="absolute -right-52 top-40 h-[520px] w-[520px] rounded-full bg-brand/15 blur-[140px]" />
      <svg className="absolute -left-20 top-0 h-[820px] w-[1600px] opacity-80" viewBox="0 0 1600 820" fill="none">
        <defs>
          <linearGradient id="streak" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#FF6A00" stopOpacity="0.9" />
            <stop offset="0.45" stopColor="#FF8A2B" stopOpacity="0.35" />
            <stop offset="1" stopColor="#FF6A00" stopOpacity="0" />
          </linearGradient>
        </defs>
        {Array.from({ length: 14 }).map((_, i) => (
          <path
            key={i}
            d={`M-40 ${520 - i * 26} C 300 ${120 - i * 18}, 760 ${40 + i * 22}, 1640 ${260 + i * 30}`}
            stroke="url(#streak)"
            strokeWidth={i % 4 === 0 ? 2 : 1}
            opacity={1 - i * 0.06}
          />
        ))}
      </svg>
    </div>
  );
}

function Eyebrow({ children }) {
  return <p className="mb-4 text-xs font-semibold uppercase tracking-[0.35em] text-brand">{children}</p>;
}

function CTA({ children = "Explorar a demonstração", className = "" }) {
  return (
    <a
      href={DEMO}
      className={`group inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3.5 text-[15px] font-semibold text-white shadow-[0_10px_40px_-10px_rgba(255,106,0,.8)] transition hover:bg-brand-dark ${className}`}
    >
      {children} <ArrowRight size={18} className="transition group-hover:translate-x-0.5" />
    </a>
  );
}

const PAINS = [
  { icon: MessageSquareWarning, title: "O pedido se perde no WhatsApp", text: "Alguém pede uma arte, um relatório, uma nota fiscal… e dois dias depois ninguém sabe quem ficou de fazer." },
  { icon: NotebookPen, title: "A reunião acaba e nada anda", text: "Sem ata e sem responsável, o que foi decidido vira “a gente tinha combinado isso?” na reunião seguinte." },
  { icon: Puzzle, title: "Ferramenta complicada ninguém usa", text: "Dezenas de campos, automações e menus. A equipe desiste na segunda semana e volta para a planilha." },
];

const FEATURES = [
  {
    icon: CalendarCheck2,
    eyebrow: "Meu dia",
    title: "Cada pessoa abre e já sabe o que fazer hoje",
    text: "Tarefas atrasadas, de hoje e dos próximos dias, a rotina do dia e os pedidos que chegaram para o setor — tudo na primeira tela. Concluir é um clique.",
    img: "/landing/app-home.webp",
  },
  {
    icon: LayoutList,
    eyebrow: "Projetos",
    title: "Lista ou quadro: cada um trabalha do seu jeito",
    text: "Veja o projeto em lista, com status e prioridades em cores, ou em quadro, arrastando cartões entre colunas. Responsável, prazo, checklist e comentários em cada tarefa.",
    img: "/landing/app-board.webp",
  },
  {
    icon: ArrowRightLeft,
    eyebrow: "Integração entre setores",
    title: "Peça a outro setor e acompanhe até a entrega",
    text: "O botão “Pedir a outro setor” cria a tarefa direto no setor certo. Quem recebe vê na tela inicial; quem pediu acompanha o status sem precisar cobrar.",
    img: "/landing/app-sector.webp",
  },
  {
    icon: FileText,
    eyebrow: "Atas",
    title: "Atas que viram tarefas sozinhas",
    text: "Registre pauta, decisões e encaminhamentos durante a reunião. Cada encaminhamento já nasce como tarefa, com responsável e prazo.",
    img: "/landing/app-atas.webp",
  },
  {
    icon: Repeat,
    eyebrow: "Rotinas",
    title: "A rotina da equipe, sem depender de memória",
    text: "Atividades diárias, semanais ou mensais com check por período. Você vê o que já foi feito hoje, por quem e a que horas.",
    img: "/landing/app-routines.webp",
  },
  {
    icon: MessageCircle,
    eyebrow: "Chat",
    title: "Chat da equipe, conectado ao Google Chat",
    text: "Um canal geral e um por setor, em tempo real. Conecte cada canal a um espaço do Google Chat e as mensagens circulam entre os dois.",
    img: "/landing/app-chat.webp",
  },
];

const ADOPTION = [
  { icon: Sparkles, title: "Poucos conceitos", text: "Setor, projeto, tarefa, rotina e ata. Só isso — a equipe aprende em minutos." },
  { icon: MousePointerClick, title: "Primeiro acesso em 2 perguntas", text: "Nome e setor. Uma tela de boas-vindas mostra os 4 passos para começar." },
  { icon: Zap, title: "Tudo em tempo real", text: "O que um colega muda aparece na hora para todo mundo, sem recarregar." },
  { icon: Smartphone, title: "Funciona no celular", text: "Direto no navegador, no computador ou no celular. Nada para instalar." },
];

const FAQ = [
  { q: "Preciso instalar alguma coisa?", a: "Não. O SpaceMais roda no navegador, no computador ou no celular." },
  { q: "Como funciona o acesso da equipe?", a: "Cada pessoa cria a conta com o e-mail e um administrador aprova o cadastro antes de liberar o acesso. Quem não foi aprovado não vê nada." },
  { q: "Integra com o Google Chat?", a: "Sim. Cada canal pode ser conectado a um espaço do Google Chat: o que é enviado no SpaceMais aparece no espaço, e mensagens que mencionam o app no Google Chat chegam ao canal." },
  { q: "Dá para usar com vários setores?", a: "Sim, é a ideia. Cada setor tem seus projetos, rotinas e atas, e os pedidos entre setores ficam registrados dos dois lados." },
  { q: "O que eu crio na demonstração fica salvo?", a: "Na demonstração, tudo fica só no seu navegador — explore à vontade. Para restaurar os dados de exemplo, use o botão ao lado do seu nome, no menu." },
];

export default function Landing() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0B0B0A] text-ink">
      {/* Navegação */}
      <header className="sticky top-0 z-30 border-b border-white/5 bg-[#0B0B0A]/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-5 py-4">
          <a href="#topo">
            <Logo size={30} textClass="text-[20px]" />
          </a>
          <nav className="ml-6 hidden gap-6 text-sm text-ink-2 md:flex">
            <a href="#recursos" className="hover:text-ink">Recursos</a>
            <a href="#como-funciona" className="hover:text-ink">Como funciona</a>
            <a href="#perguntas" className="hover:text-ink">Perguntas</a>
          </nav>
          <div className="flex-1" />
          <a href={DEMO} className="whitespace-nowrap rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
            <span className="sm:hidden">Demo</span>
            <span className="hidden sm:inline">Ver demonstração</span>
          </a>
        </div>
      </header>

      {/* Hero */}
      <section id="topo" className="relative">
        <Glow />
        <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-20 text-center md:pt-28">
          <Eyebrow>
            Gestão de projetos <Plus size={12} className="inline -translate-y-px" strokeWidth={3} />
          </Eyebrow>
          <h1 className="mx-auto max-w-4xl font-display text-[40px] font-bold leading-[1.05] tracking-tight md:text-[68px]">
            Rotina, projetos e reuniões da sua equipe. <span className="text-brand">Num lugar só.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-2">
            O SpaceMais junta o que hoje está espalhado em WhatsApp, planilhas e e-mail — com a simplicidade que faz a equipe
            usar de verdade, desde o primeiro dia.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <CTA />
            <a href="#recursos" className="inline-flex items-center gap-2 rounded-xl border border-line-strong px-6 py-3.5 text-[15px] font-semibold text-ink hover:bg-white/5">
              Ver recursos
            </a>
          </div>
          <p className="mt-4 text-sm text-muted">Sem cadastro. Abre direto no navegador, com dados de exemplo.</p>

          <div className="mt-16">
            <ProductTour />
          </div>
        </div>
      </section>

      {/* Dores */}
      <section className="border-y border-white/5 bg-[#0F0F0E] py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <Eyebrow>O problema</Eyebrow>
            <h2 className="font-display text-3xl font-bold md:text-[42px] md:leading-tight">Sua equipe trabalha muito. O difícil é saber onde está cada coisa.</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {PAINS.map((p) => (
              <div key={p.title} className="rounded-2xl border border-line bg-surface/60 p-6">
                <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line-strong bg-[#161615] text-brand">
                  <p.icon size={21} />
                </span>
                <h3 className="mb-2 font-display text-lg font-semibold">{p.title}</h3>
                <p className="text-[15px] leading-relaxed text-ink-2">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recursos */}
      <section id="recursos" className="relative py-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <Eyebrow>Recursos</Eyebrow>
            <h2 className="font-display text-3xl font-bold md:text-[42px] md:leading-tight">Tudo o que a equipe precisa. Nada do que ela não usa.</h2>
          </div>
          <div className="space-y-24">
            {FEATURES.map((f, i) => (
              <div key={f.title} className={`grid items-center gap-10 ${i % 2 ? "md:grid-cols-[1.15fr_0.85fr] md:[&>*:first-child]:order-2" : "md:grid-cols-[0.85fr_1.15fr]"}`}>
                <div>
                  <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
                    <f.icon size={14} /> {f.eyebrow}
                  </span>
                  <h3 className="mb-4 font-display text-2xl font-bold leading-snug md:text-[32px]">{f.title}</h3>
                  <p className="text-[16px] leading-relaxed text-ink-2">{f.text}</p>
                </div>
                <div className="relative">
                  <div className="pointer-events-none absolute -inset-6 rounded-[32px] bg-brand/10 blur-2xl" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.img} alt={f.title} loading="lazy" className="relative w-full rounded-xl border border-line-strong shadow-pop" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Adoção */}
      <section className="border-y border-white/5 bg-[#0F0F0E] py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <Eyebrow>Feito para ser adotado</Eyebrow>
            <h2 className="font-display text-3xl font-bold md:text-[42px] md:leading-tight">Simples o bastante para a equipe inteira usar.</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ADOPTION.map((a) => (
              <div key={a.title} className="rounded-2xl border border-line bg-surface/60 p-6">
                <a.icon size={22} className="mb-4 text-brand" />
                <h3 className="mb-1.5 font-display text-[17px] font-semibold">{a.title}</h3>
                <p className="text-[14.5px] leading-relaxed text-ink-2">{a.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="py-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <Eyebrow>Como funciona</Eyebrow>
            <h2 className="font-display text-3xl font-bold md:text-[42px] md:leading-tight">Do convite ao primeiro projeto em uma tarde.</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              ["01", "Monte os setores", "Cadastre os setores da empresa e convide as pessoas. Cada cadastro é aprovado por um administrador."],
              ["02", "Traga a rotina", "Crie as rotinas de cada setor e os projetos em andamento. Atas e pedidos passam a ser registrados ali."],
              ["03", "Acompanhe", "Cada pessoa começa o dia no SpaceMais; gestores enxergam o andamento de cada setor e projeto."],
            ].map(([n, t, d]) => (
              <div key={n} className="relative rounded-2xl border border-line bg-surface/60 p-7">
                <span className="font-display text-5xl font-bold text-brand/90">{n}</span>
                <h3 className="mb-2 mt-4 font-display text-xl font-semibold">{t}</h3>
                <p className="text-[15px] leading-relaxed text-ink-2">{d}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted">
            <ShieldCheck size={16} className="text-brand" /> Acesso só para cadastros aprovados, com controle de permissões no banco de dados.
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="perguntas" className="border-t border-white/5 bg-[#0F0F0E] py-20">
        <div className="mx-auto max-w-3xl px-5">
          <div className="mb-10 text-center">
            <Eyebrow>Perguntas</Eyebrow>
            <h2 className="font-display text-3xl font-bold md:text-[40px]">Perguntas frequentes</h2>
          </div>
          <div className="space-y-3">
            {FAQ.map((f) => (
              <details key={f.q} className="group rounded-xl border border-line bg-surface/60 px-5 py-4 open:border-line-strong">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-[16px] font-semibold">
                  {f.q}
                  <Plus size={18} className="shrink-0 text-brand transition group-open:rotate-45" />
                </summary>
                <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="relative overflow-hidden py-28">
        <Glow />
        <div className="relative mx-auto max-w-3xl px-5 text-center">
          <span className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-[28px] border border-brand/40 bg-gradient-to-b from-[#2a1a0e] to-[#141413] shadow-glow">
            <LogoMark size={50} />
          </span>
          <h2 className="font-display text-4xl font-bold leading-tight md:text-[52px]">Veja o SpaceMais funcionando.</h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-ink-2">
            Abra a demonstração, crie uma tarefa, peça algo a outro setor, registre uma ata. Leva dois minutos.
          </p>
          <CTA className="mt-9">Abrir a demonstração</CTA>
        </div>
      </section>

      <footer className="border-t border-white/5 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 text-sm text-muted md:flex-row">
          <Logo size={22} textClass="text-[16px]" />
          <p className="tracking-[0.3em] text-[11px] uppercase">Gestão de projetos +</p>
          <p>© {new Date().getFullYear()} SpaceMais</p>
        </div>
      </footer>
    </div>
  );
}
