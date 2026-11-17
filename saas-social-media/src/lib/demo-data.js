// Dados fictícios do modo demonstração (/demo). Nada é salvo no banco.

const img = (n) => ({ path: `demo/p${n}.jpg`, url: `/demo/p${n}.jpg`, type: "image" });

function at(dayOffset, hour, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export function buildDemoData() {
  const workspace = { id: "demo-ws", name: "Agência Aurora", role: "owner", stage_deadlines: { theme: 10, content: 7, media: 5, caption: 3 } };
  const user = { id: "demo-user", email: "ana@agenciaaurora.com.br" };
  const members = [
    { user_id: "demo-user", email: "ana@agenciaaurora.com.br", full_name: "Ana Souza", role: "owner", functions: ["strategy", "management"] },
    { user_id: "m-bruno", email: "bruno@agenciaaurora.com.br", full_name: "Bruno Lima", role: "member", functions: ["design", "video"] },
    { user_id: "m-carla", email: "carla@agenciaaurora.com.br", full_name: "Carla Dias", role: "member", functions: ["copy"] },
  ];
  const team = { theme: "demo-user", content: "m-carla", media: "m-bruno", caption: "m-carla" };
  const withTeam = (statusOrStages) => {
    const st = typeof statusOrStages === "string" ? null : statusOrStages;
    return Object.fromEntries(["theme", "content", "media", "caption"].map((k) => [k, { ...(st?.[k] || {}), assignee: team[k] }]));
  };

  const clients = [
    { id: "c1", default_team: team, name: "Bella Doceria", instagram_handle: "@belladoceria", color: "#F2557A", notes: "Tom leve e divertido. Evitar falar de dieta.", niche: "Alimentação", contact_name: "Júlia Martins", contact_phone: "(11) 98765-4321", contact_email: "contato@belladoceria.com.br", contract_status: "active", monthly_fee: 1800, billing_day: 10, payment_method: "Pix", contract_start: "2026-03-01", contract_end: "2026-12-10", services: ["Gestão de redes sociais", "Feed", "Reels", "Stories", "Design"], approval_token: "00000000-0000-4000-8000-000000000001" },
    { id: "c2", default_team: team, name: "Studio Fit", instagram_handle: "@studiofit", color: "#F5A524", notes: "Foco em resultado e comunidade.", niche: "Fitness", contact_name: "Rafa Lima", contract_status: "active", monthly_fee: 1500, billing_day: 5, payment_method: "Boleto", contract_start: "2026-01-15", contract_end: "2027-01-15", services: ["Feed", "Reels", "Tráfego pago"], approval_token: "00000000-0000-4000-8000-000000000002" },
    { id: "c3", default_team: { ...team, media: "m-bruno" }, name: "Clínica Sorriso", instagram_handle: "@clinicasorriso", color: "#7C5CFC", notes: "Linguagem acolhedora, sem termos técnicos.", niche: "Odontologia", contract_status: "active", monthly_fee: 2500, billing_day: 20, payment_method: "Pix", contract_start: "2026-05-01", services: ["Gestão de redes sociais", "Feed", "Stories", "Relatórios"], approval_token: "00000000-0000-4000-8000-000000000003" },
    { id: "c4", name: "Café Grão", instagram_handle: "@cafegrao", color: "#22B07D", notes: "", niche: "Gastronomia", contract_status: "negotiation", monthly_fee: 1200, services: ["Feed", "Stories"], approval_token: "00000000-0000-4000-8000-000000000004" },
    { id: "c5", name: "Lumen Arquitetura", instagram_handle: "@lumen.arq", color: "#3B82F6", notes: "", niche: "Arquitetura", contract_status: "active", monthly_fee: 2200, billing_day: 15, payment_method: "Transferência", contract_start: "2026-06-01", contract_end: "2026-12-01", services: ["Feed", "Design", "Captação de foto/vídeo"], approval_token: "00000000-0000-4000-8000-000000000005" },
    { id: "c6", name: "Pet Amigo", instagram_handle: "@petamigo", color: "#E879F9", notes: "", niche: "Pet", contract_status: "paused", monthly_fee: 900, services: ["Feed"], approval_token: "00000000-0000-4000-8000-000000000006" },
  ];

  const p = (id, client_id, title, status, scheduled_at, media, format = "feed", tags = [], caption) => ({
    id, client_id, title, status, scheduled_at, media, format, tags, networks: ["instagram"],
    caption: caption || `${title} ✨\n\nConteúdo planejado pela equipe. Comente o que achou! 👇`,
    workspace_id: workspace.id,
    stages: withTeam(status),
  });

  const posts = [
    p("p1", "c1", "Lançamento bolo de pote", "scheduled", at(1, 11), [img(1)], "feed", ["lançamento"]),
    p("p2", "c1", "Bastidores da cozinha", "in_review", at(2, 18), [img(6)], "reels", ["bastidores"]),
    {
      ...p("p3", "c1", "Promo dia dos namorados", "in_review", at(5, 10), [img(10), img(6), img(1)], "carousel", ["promoção"]),
      theme: "Carrossel com 3 opções de caixa presente para o Dia dos Namorados, com preço e prazo de encomenda.",
      reference_links: ["https://instagram.com/p/exemplo1", "https://instagram.com/p/exemplo2"],
      content_text: "Slide 1: Surpreenda quem você ama 💘\nSlide 2: Caixa 6 doces — R$ 49,90\nSlide 3: Caixa 12 doces — R$ 89,90",
      stages: withTeam({ theme: { status: "in_review" }, content: { status: "draft" }, media: { status: "draft" }, caption: { status: "draft" } }),
    },
    p("p4", "c1", "Depoimento cliente", "published", at(-3, 12), [img(12)]),
    p("p5", "c2", "Desafio 30 dias", "in_review", at(1, 7, 30), [img(2), img(7)], "carousel", ["desafio"]),
    p("p6", "c2", "Treino de 15 min", "changes_requested", at(3, 6), [img(9)], "reels"),
    p("p7", "c2", "Antes e depois", "approved", null, [img(11)]),
    p("p8", "c3", "Mitos sobre clareamento", "scheduled", at(0, 19), [img(3)], "carousel", ["educativo"]),
    p("p9", "c3", "Conheça a equipe", "in_review", at(4, 12), [img(8)]),
    p("p10", "c3", "Dica de escovação", "published", at(-1, 9), [img(5)]),
    p("p11", "c4", "Novo blend da casa", "scheduled", at(2, 8), [img(7)], "feed", ["produto"]),
    p("p12", "c4", "Latte art", "draft", at(6, 15), [img(4)], "reels"),
    p("p13", "c5", "Projeto Casa Jardim", "in_review", at(3, 17), [img(5), img(8), img(3)], "carousel"),
    p("p14", "c5", "Antes e depois — sala", "scheduled", at(7, 11), [img(11)]),
    p("p15", "c6", "Adote um amigo", "changes_requested", at(2, 13), [img(4)]),
    p("p16", "c6", "Banho e tosa", "draft", null, [img(9)], "story"),
    p("p17", "c2", "Aula experimental grátis", "scheduled", at(-6, 18), [img(2)]),
    p("p18", "c3", "Horários de fim de ano", "draft", at(9, 10), []),
    p("p19", "c4", "Café da manhã especial", "published", at(-5, 8), [img(1)]),
    p("p20", "c1", "Sorteio 10k", "approved", at(8, 20), [img(6)]),
  ];

  const accounts = [
    { id: "a1", client_id: "c1", provider: "instagram", username: "belladoceria" },
    { id: "a2", client_id: "c3", provider: "instagram", username: "clinicasorriso" },
  ];

  const comments = {
    p6: [{ id: "m1", post_id: "p6", author_type: "client", author_name: "Rafa (Studio Fit)", body: "Amei! Só troca a música por algo mais animado? 🙏", created_at: at(-1, 15) }],
    p15: [{ id: "m2", post_id: "p15", author_type: "client", author_name: "Júlia", body: "Pode colocar o telefone da ONG na legenda?", created_at: at(-1, 10) }],
  };

  const ago = (min) => new Date(Date.now() - min * 60000).toISOString();
  const n = (id, kind, title, body, min, extra = {}) => ({ id, kind, title, body, created_at: ago(min), read_at: null, is_mention: false, actor: "", ...extra });
  const notifications = [
    n("nt1", "client_comment", "Bella Doceria comentou em Mídia", "Bastidores da cozinha: Pode usar a foto 2 no lugar da 1?", 4, { post_id: "p2", client_id: "c1", stage: "media", actor: "Júlia", is_mention: true }),
    n("nt2", "client_changes", "Studio Fit pediu ajuste em Mídia", "Treino de 15 min", 55, { post_id: "p6", client_id: "c2", actor: "Rafa" }),
    n("nt3", "your_turn", "Sua vez: Conteúdo", "Bella Doceria · Promo dia dos namorados (Tema aprovado)", 120, { post_id: "p3", client_id: "c1", stage: "content", is_mention: true }),
    n("nt4", "client_approved", "Clínica Sorriso aprovou o conteúdo", "Mitos sobre clareamento", 180, { post_id: "p8", client_id: "c3", actor: "Clínica Sorriso" }),
    n("nt5", "published", "Post publicado no Instagram", "Bella Doceria · Depoimento cliente", 60 * 26, { post_id: "p4", client_id: "c1", actor: "Sistema", read_at: ago(60 * 20) }),
    n("nt6", "assigned", "Nova tarefa: Legenda", "Lumen Arquitetura · Projeto Casa Jardim", 60 * 30, { post_id: "p13", client_id: "c5", stage: "caption", is_mention: true, read_at: ago(60 * 29) }),
  ];

  // Etapas variadas para a demonstração ficar realista
  const MIX = {
    p5: { theme: { status: "approved" }, content: { status: "approved" }, media: { status: "in_review" }, caption: { status: "draft" } },
    p6: { theme: { status: "approved" }, content: { status: "approved" }, media: { status: "changes_requested" }, caption: { status: "approved" } },
    p12: { theme: { status: "approved" }, content: { status: "draft" }, media: { status: "draft" }, caption: { status: "draft" } },
    p13: { theme: { status: "approved" }, content: { status: "approved" }, media: { status: "approved" }, caption: { status: "draft" } },
    p9: { theme: { status: "approved" }, content: { status: "in_review" }, media: { status: "draft" }, caption: { status: "draft" } },
    p15: { theme: { status: "approved" }, content: { status: "approved" }, media: { status: "changes_requested" }, caption: { status: "draft" } },
  };
  for (const post of posts) if (MIX[post.id]) post.stages = withTeam(MIX[post.id]);

  return { workspace, user, members, clients, posts, accounts, comments, notifications };
}
