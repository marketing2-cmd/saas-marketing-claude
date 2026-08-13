-- Dados de demonstração — equivalentes às funções seedProjects()/seedCampaigns()/etc.
-- do componente original. Rode este script uma única vez, depois de aplicar schema.sql,
-- se quiser começar com os mesmos exemplos do artifact original.
--
-- Sem este seed, a aplicação simplesmente começa com as tabelas vazias (o que é o
-- comportamento correto e esperado de um banco real).

insert into projects (id, name, objective, description, category, area, status, owner, team, supplier, investment, deadline, priority, checklist, comments) values
('seed-proj-1', 'Reposicionamento de vitrine — Linha Iluminação', 'Aumentar conversão de passantes em loja física',
 'Redesenhar a vitrine principal para destacar a nova linha de LED, com sinalização de preço e QR code para catálogo completo.',
 'Iluminação', 'Loja Física', 'Em Andamento', 'Marina Costa', '["Marina Costa","Diego Alves"]', 'Osram', 4200, CURRENT_DATE + 6, 'Alta',
 '[{"id":"chk-1","text":"Brief com o visual merchandising","done":true},{"id":"chk-2","text":"Aprovar peças com fornecedor","done":true},{"id":"chk-3","text":"Instalação na loja","done":false},{"id":"chk-4","text":"Fotos do resultado final","done":false}]',
 '[{"id":"cmt-1","text":"Fornecedor confirmou contrapartida de R$1.500 em materiais.","author":"Marina Costa","date":now()}]'),
('seed-proj-2', 'Catálogo digital de Ferramentas 2026', 'Dar suporte a vendedores e ao tráfego pago com peça de referência',
 'PDF interativo com todas as linhas de ferramentas, preços sugeridos e QR codes por categoria.',
 'Ferramentas', 'CRM', 'Planejamento', 'Diego Alves', '["Diego Alves"]', 'Bosch', 1800, CURRENT_DATE + 18, 'Média',
 '[{"id":"chk-5","text":"Levantar SKUs com o comercial","done":true},{"id":"chk-6","text":"Diagramação","done":false}]', '[]'),
('seed-proj-3', 'Treinamento de equipe — Hidráulica', 'Capacitar vendedores sobre a nova linha de conexões',
 '', 'Hidráulica', 'Eventos', 'Backlog', 'Marina Costa', '[]', 'Tigre', 0, null, 'Baixa', '[]', '[]');

insert into campaigns (id, name, objective, supplier, categories, products, team, budget, budget_spent, start_date, end_date, checklist, status, roi, results, materials, prospects, comments) values
('seed-camp-1', 'Semana do Eletricista', 'Gerar tráfego na loja e vendas da linha elétrica com desconto de parceiros',
 'Schneider Electric', '["Elétrica"]', '["Disjuntores","Fios e cabos","Tomadas"]', '["Marina Costa","Diego Alves"]',
 12000, 7400, CURRENT_DATE + 2, CURRENT_DATE + 9,
 '[{"id":"chk-7","text":"Aprovar verba com fornecedor","done":true},{"id":"chk-8","text":"Criar peças para redes sociais","done":true},{"id":"chk-9","text":"Disparo WhatsApp para base","done":false},{"id":"chk-10","text":"Ativação de tráfego pago","done":false}]',
 'Em Execução', null, '', '["Banner loja","Stories","Cartaz PDV"]',
 '[{"id":"pros-1","supplier":"Schneider Electric","contact":"Carla Nunes","stage":"Termo Assinado","value":12000,"paymentMethod":"Bonificação","notes":"Verba principal da campanha.","aporteRegistrado":true,"createdAt":"","updatedAt":""},{"id":"pros-2","supplier":"Intelbras","contact":"","stage":"Negociando","value":4000,"paymentMethod":"Pix","notes":"Aguardando contraproposta.","aporteRegistrado":false,"createdAt":"","updatedAt":""},{"id":"pros-3","supplier":"WEG","contact":"","stage":"Prospectar","value":"","paymentMethod":"Abatimento em boleto","notes":"","aporteRegistrado":false,"createdAt":"","updatedAt":""}]',
 '[]'),
('seed-camp-2', 'Dia das Mães — Utilidades para Casa', 'Impulsionar vendas de utilidades no período sazonal',
 'Tramontina', '["Utilidades"]', '["Panelas","Organizadores"]', '["Marina Costa"]',
 6000, 0, CURRENT_DATE + 20, CURRENT_DATE + 28,
 '[{"id":"chk-11","text":"Definir mecânica da promoção","done":false}]',
 'Planejamento', null, '', '[]',
 '[{"id":"pros-4","supplier":"Tramontina","contact":"Juliana Prado","stage":"Assinar Termo","value":6000,"paymentMethod":"Abatimento em boleto","notes":"Termo enviado, aguardando assinatura.","aporteRegistrado":false,"createdAt":"","updatedAt":""}]',
 '[]');

insert into demands (id, title, description, channel, requester, category, priority, owner, deadline, impact, status) values
('seed-dem-1', 'Cliente pediu catálogo impresso na loja', 'Cliente recorrente pediu catálogo físico atualizado de ferramentas na próxima visita.',
 'WhatsApp', 'Fernanda (atendente loja)', 'Rotina', 'Baixa', 'Diego Alves', CURRENT_DATE + 5, 'Baixo', 'Nova'),
('seed-dem-2', 'Fornecedor Tramontina quer antecipar campanha do Dia das Mães', 'Representante sugeriu adiantar em 1 semana, com verba extra de R$2.000 se aprovado até sexta.',
 'E-mail', 'Representante Tramontina', 'Campanha', 'Alta', 'Marina Costa', CURRENT_DATE + 3, 'Alto', 'Em Triagem'),
('seed-dem-3', 'Vazamento na loja atrasou instalação da vitrine', 'Manutenção precisa entrar antes da equipe de visual merchandising.',
 'Verbal', 'Gerente de loja', 'Urgente', 'Urgente', '', CURRENT_DATE + 1, 'Alto', 'Nova');

insert into suppliers (id, name, brands, representative, email, phone, annual_budget, transactions, notes) values
('seed-sup-1', 'Schneider Electric', '["Schneider"]', 'Carla Nunes', 'carla@schneider.com.br', '(11) 98888-0000', 40000,
 '[{"id":"tx-1","type":"Aporte recebido","description":"Repasse de verba — 1º semestre","amount":20000,"date":""},{"id":"tx-2","type":"Contrapartida (material)","description":"Banners e material de PDV","amount":1500,"date":""}]',
 'Parceiro estratégico da linha elétrica. Renovação de verba em dezembro.'),
('seed-sup-2', 'Osram', '["Osram","Ledvance"]', 'Paulo Reis', 'paulo@osram.com', '', 15000,
 '[{"id":"tx-3","type":"Aporte recebido","description":"Verba campanha vitrine","amount":5000,"date":""}]', ''),
('seed-sup-3', 'Tramontina', '["Tramontina"]', 'Juliana Prado', '', '(51) 97777-1234', 18000, '[]',
 'Costuma liberar verba extra para datas sazonais.');

insert into events (id, title, type, date, description) values
('seed-evt-1', 'Reunião mensal de marketing', 'Reunião', CURRENT_DATE + 4, ''),
('seed-evt-2', 'Treinamento equipe de vendas — Hidráulica', 'Treinamento', CURRENT_DATE + 10, ''),
('seed-evt-3', 'Dia do Eletricista', 'Data comercial', CURRENT_DATE + 15, '');

insert into team_members (id, name, role, email, phone, skills, vacation_start, vacation_end, goals, feedbacks) values
('seed-team-1', 'Marina Costa', 'Head de Marketing', 'marina@contattosmais.com.br', '', '["Estratégia","Trade Marketing","Fornecedores"]', null, null,
 'Aumentar o ROI de campanhas cooperadas em 20% no semestre.', '[]'),
('seed-team-2', 'Diego Alves', 'Analista de Conteúdo', 'diego@contattosmais.com.br', '', '["Redes Sociais","Design","Copywriting"]', null, null, '', '[]'),
('seed-team-3', 'Bruno Ferreira', 'Analista de Trade Marketing', 'bruno@contattosmais.com.br', '', '["PDV","Promotores","Eventos"]', null, null, '', '[]');
