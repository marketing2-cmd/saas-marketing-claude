// Dados de exemplo do modo demonstração (NEXT_PUBLIC_SPACE_DEMO=1).
// Datas são relativas a "hoje", para a demo nunca parecer velha.

import { toISODate, addDays, periodKey } from "./model";

export const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";

export function demoSeed() {
  const today = new Date();
  const d = (n) => toISODate(addDays(today, n));
  const ts = (minutesAgo) => new Date(Date.now() - minutesAgo * 60000).toISOString();

  const sectors = [
    { id: "marketing", name: "Marketing", color: "#0038FF", position: 1 },
    { id: "comercial", name: "Comercial", color: "#00A86B", position: 2 },
    { id: "financeiro", name: "Financeiro", color: "#F2A100", position: 3 },
    { id: "operacoes", name: "Operações", color: "#7B3FF2", position: 4 },
    { id: "rh", name: "Pessoas/RH", color: "#E23744", position: 5 },
  ];

  const U = {
    me: DEMO_USER_ID,
    ana: "00000000-0000-0000-0000-000000000002",
    bruno: "00000000-0000-0000-0000-000000000003",
    carla: "00000000-0000-0000-0000-000000000004",
    diego: "00000000-0000-0000-0000-000000000005",
  };

  const members = [
    { id: U.me, name: "Você", email: "voce@contattos.com", sector_id: "marketing" },
    { id: U.ana, name: "Ana Souza", email: "ana@contattos.com", sector_id: "marketing" },
    { id: U.bruno, name: "Bruno Lima", email: "bruno@contattos.com", sector_id: "comercial" },
    { id: U.carla, name: "Carla Mendes", email: "carla@contattos.com", sector_id: "financeiro" },
    { id: U.diego, name: "Diego Rocha", email: "diego@contattos.com", sector_id: "operacoes" },
  ];

  const projects = [
    { id: "p1", sector_id: "marketing", name: "Campanha Black Friday", description: "Peças, mídia e e-mails da campanha de novembro.", color: "#FF6A00", archived: false, created_at: ts(9000) },
    { id: "p2", sector_id: "marketing", name: "Novo site institucional", description: "Reformulação do site com foco em geração de leads.", color: "#7B3FF2", archived: false, created_at: ts(8000) },
    { id: "p3", sector_id: "comercial", name: "Feira do Varejo 2026", description: "Estande, materiais e agenda da equipe.", color: "#00A86B", archived: false, created_at: ts(7000) },
    { id: "p4", sector_id: "operacoes", name: "Mudança do estoque", description: "Transferência para o novo galpão.", color: "#F2A100", archived: false, created_at: ts(6000) },
  ];

  let pos = 0;
  const task = (t) => ({
    description: "",
    sector_id: null,
    project_id: null,
    requested_by_sector_id: null,
    source_minute_id: null,
    status: "todo",
    priority: "medium",
    assignee_id: null,
    due_date: null,
    checklist: [],
    position: ++pos,
    created_by: U.me,
    created_at: ts(5000 - pos * 10),
    updated_at: ts(100),
    completed_at: null,
    ...t,
  });

  const tasks = [
    task({ id: "t1", title: "Criar artes para Instagram", project_id: "p1", sector_id: "marketing", status: "doing", priority: "high", assignee_id: U.me, due_date: d(0), checklist: [{ id: "c1", text: "Feed (3 artes)", done: true }, { id: "c2", text: "Stories (5 artes)", done: false }] }),
    task({ id: "t2", title: "Aprovar verba de mídia paga", project_id: "p1", sector_id: "marketing", status: "review", priority: "urgent", assignee_id: U.ana, due_date: d(-1) }),
    task({ id: "t3", title: "Disparo de e-mail para base de clientes", project_id: "p1", sector_id: "marketing", status: "todo", assignee_id: U.me, due_date: d(2) }),
    task({ id: "t4", title: "Briefing com fornecedores parceiros", project_id: "p1", sector_id: "marketing", status: "done", assignee_id: U.ana, due_date: d(-4), completed_at: ts(3000) }),
    task({ id: "t5", title: "Wireframe da home", project_id: "p2", sector_id: "marketing", status: "doing", assignee_id: U.ana, due_date: d(5) }),
    task({ id: "t6", title: "Textos da página Sobre", project_id: "p2", sector_id: "marketing", status: "todo", priority: "low", assignee_id: U.me, due_date: d(9) }),
    task({ id: "t7", title: "Reservar estande", project_id: "p3", sector_id: "comercial", status: "done", assignee_id: U.bruno, completed_at: ts(9000) }),
    task({ id: "t8", title: "Lista de clientes para convidar", project_id: "p3", sector_id: "comercial", status: "doing", priority: "high", assignee_id: U.bruno, due_date: d(3) }),
    task({ id: "t9", title: "Contratar transportadora", project_id: "p4", sector_id: "operacoes", status: "todo", priority: "high", assignee_id: U.diego, due_date: d(6) }),
    // Pedidos entre setores (integração)
    task({ id: "t10", title: "Banner e folder para a Feira do Varejo", description: "Precisamos de 1 banner 2x1m e 500 folders até a semana da feira.", sector_id: "marketing", requested_by_sector_id: "comercial", status: "todo", priority: "high", due_date: d(4), created_by: U.bruno }),
    task({ id: "t11", title: "Relatório de investimento em mídia do trimestre", sector_id: "marketing", requested_by_sector_id: "financeiro", status: "todo", due_date: d(7), created_by: U.carla }),
    task({ id: "t12", title: "Nota fiscal do fornecedor de brindes", sector_id: "financeiro", requested_by_sector_id: "marketing", status: "doing", assignee_id: U.carla, due_date: d(1), created_by: U.me }),
    // Encaminhamento de ata
    task({ id: "t13", title: "Enviar cronograma da campanha para o Comercial", sector_id: "marketing", source_minute_id: "m1", assignee_id: U.me, due_date: d(1) }),
  ];

  const comments = [
    { id: "cm1", task_id: "t1", author_id: U.ana, body: "Usar a paleta nova da campanha, por favor!", created_at: ts(240) },
    { id: "cm2", task_id: "t10", author_id: U.bruno, body: "A feira começa dia 10, se der para adiantar ajuda muito.", created_at: ts(600) },
  ];

  const routines = [
    { id: "r1", sector_id: "marketing", title: "Responder comentários e directs", assignee_id: U.me, frequency: "daily", weekday: null, month_day: null, active: true },
    { id: "r2", sector_id: "marketing", title: "Conferir métricas das campanhas ativas", assignee_id: U.me, frequency: "daily", weekday: null, month_day: null, active: true },
    { id: "r3", sector_id: "marketing", title: "Reunião de pauta semanal", assignee_id: U.ana, frequency: "weekly", weekday: 1, month_day: null, active: true },
    { id: "r4", sector_id: "marketing", title: "Relatório mensal de resultados", assignee_id: U.me, frequency: "monthly", weekday: null, month_day: 5, active: true },
    { id: "r5", sector_id: "financeiro", title: "Conciliação bancária", assignee_id: U.carla, frequency: "daily", weekday: null, month_day: null, active: true },
    { id: "r6", sector_id: "comercial", title: "Atualizar funil de vendas", assignee_id: U.bruno, frequency: "weekly", weekday: 5, month_day: null, active: true },
  ];

  const checks = [
    { id: `r2:${periodKey(routines[1])}`, routine_id: "r2", period_key: periodKey(routines[1]), done_by: U.me, done_at: ts(90) },
  ];

  const minutes = [
    {
      id: "m1",
      sector_id: "marketing",
      title: "Alinhamento Black Friday",
      meeting_date: d(-2),
      participants: [U.me, U.ana, U.bruno],
      notes: "Pauta\n• Status das peças\n• Verba de mídia\n• Integração com o Comercial\n\nAs peças de feed estão prontas; stories atrasados por falta de fotos de produto.",
      decisions: "• Verba de mídia fica em R$ 15 mil, sendo 60% Meta e 40% Google.\n• Comercial recebe o cronograma até amanhã.",
      created_by: U.me,
      created_at: ts(2880),
      updated_at: ts(2880),
    },
  ];

  const channels = [
    { id: "geral", name: "geral", sector_id: null, google_space_label: "Contattos+ | Geral", position: 0 },
    { id: "ch-marketing", name: "marketing", sector_id: "marketing", google_space_label: "", position: 1 },
    { id: "ch-comercial", name: "comercial", sector_id: "comercial", google_space_label: "", position: 2 },
    { id: "ch-financeiro", name: "financeiro", sector_id: "financeiro", google_space_label: "", position: 3 },
    { id: "ch-operacoes", name: "operacoes", sector_id: "operacoes", google_space_label: "", position: 4 },
    { id: "ch-rh", name: "pessoas", sector_id: "rh", google_space_label: "", position: 5 },
  ];

  const messages = [
    { id: "msg1", channel_id: "geral", author_id: U.carla, author_name: "Carla Mendes", body: "Bom dia, pessoal! Lembrando que o fechamento do mês é dia 28.", source: "google_chat", created_at: ts(180) },
    { id: "msg2", channel_id: "geral", author_id: U.bruno, author_name: "Bruno Lima", body: "Anotado! Já abri o pedido do banner da feira para o Marketing pelo SpaceMais.", source: "space", created_at: ts(150) },
    { id: "msg3", channel_id: "geral", author_id: U.ana, author_name: "Ana Souza", body: "Recebemos, Bruno. Entra na nossa fila ainda essa semana 👍", source: "space", created_at: ts(120) },
    { id: "msg4", channel_id: "ch-marketing", author_id: U.ana, author_name: "Ana Souza", body: "Subi as artes de feed na pasta da campanha.", source: "space", created_at: ts(60) },
  ];

  return { sectors, members, projects, tasks, comments, routines, checks, minutes, channels, messages };
}
