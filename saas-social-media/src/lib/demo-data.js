// Dados fictícios do modo demonstração (/demo). Nada é salvo no banco.

const img = (n) => ({ path: `demo/p${n}.jpg`, url: `/demo/p${n}.jpg`, type: "image" });

function at(dayOffset, hour, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export function buildDemoData() {
  const workspace = { id: "demo-ws", name: "Agência Aurora", role: "owner" };
  const user = { id: "demo-user", email: "ana@agenciaaurora.com.br" };

  const clients = [
    { id: "c1", name: "Bella Doceria", instagram_handle: "@belladoceria", color: "#F2557A", notes: "Tom leve e divertido. Evitar falar de dieta.", approval_token: "00000000-0000-4000-8000-000000000001" },
    { id: "c2", name: "Studio Fit", instagram_handle: "@studiofit", color: "#F5A524", notes: "Foco em resultado e comunidade.", approval_token: "00000000-0000-4000-8000-000000000002" },
    { id: "c3", name: "Clínica Sorriso", instagram_handle: "@clinicasorriso", color: "#7C5CFC", notes: "Linguagem acolhedora, sem termos técnicos.", approval_token: "00000000-0000-4000-8000-000000000003" },
    { id: "c4", name: "Café Grão", instagram_handle: "@cafegrao", color: "#22B07D", notes: "", approval_token: "00000000-0000-4000-8000-000000000004" },
    { id: "c5", name: "Lumen Arquitetura", instagram_handle: "@lumen.arq", color: "#3B82F6", notes: "", approval_token: "00000000-0000-4000-8000-000000000005" },
    { id: "c6", name: "Pet Amigo", instagram_handle: "@petamigo", color: "#E879F9", notes: "", approval_token: "00000000-0000-4000-8000-000000000006" },
  ];

  const p = (id, client_id, title, status, scheduled_at, media, format = "feed", tags = [], caption) => ({
    id, client_id, title, status, scheduled_at, media, format, tags, networks: ["instagram"],
    caption: caption || `${title} ✨\n\nConteúdo planejado pela equipe. Comente o que achou! 👇`,
    workspace_id: workspace.id,
  });

  const posts = [
    p("p1", "c1", "Lançamento bolo de pote", "scheduled", at(1, 11), [img(1)], "feed", ["lançamento"]),
    p("p2", "c1", "Bastidores da cozinha", "in_review", at(2, 18), [img(6)], "reels", ["bastidores"]),
    p("p3", "c1", "Promo dia dos namorados", "draft", at(5, 10), [img(10)], "carousel", ["promoção"]),
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

  return { workspace, user, clients, posts, accounts, comments };
}
