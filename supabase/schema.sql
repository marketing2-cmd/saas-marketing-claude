-- Marketing OS — schema Postgres/Supabase
--
-- Substitui o armazenamento em `window.storage` do componente original (artifact do Claude.ai).
--
-- Decisões de modelagem:
--   * "id" é TEXT (não UUID), porque o front-end continua gerando ids no cliente com a
--     função uid() (ex.: "k3j9f8g2a1b4"), exatamente como no componente original — isso evita
--     reescrever a lógica de criação de itens/checklist/comentários/etc.
--   * Listas aninhadas (checklist, comentários, prospecção de fornecedores, transações
--     financeiras, feedbacks, tags) ficam em colunas JSONB, preservando o formato exato dos
--     objetos manipulados pelo React (nenhuma tabela filha, nenhuma normalização extra).
--   * Campos usados para filtro/ordenação no board (status, prioridade, categoria, prazo)
--     são colunas próprias, para permitir index e consultas eficientes.

create table if not exists projects (
  id text primary key,
  name text not null default '',
  objective text default '',
  description text default '',
  category text,
  area text,
  status text not null default 'Backlog',
  owner text default '',
  team jsonb not null default '[]',
  supplier text default '',
  investment numeric,
  deadline date,
  priority text default 'Média',
  checklist jsonb not null default '[]',
  comments jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists campaigns (
  id text primary key,
  name text not null default '',
  objective text default '',
  supplier text default '',
  categories jsonb not null default '[]',
  products jsonb not null default '[]',
  team jsonb not null default '[]',
  budget numeric,
  budget_spent numeric,
  start_date date,
  end_date date,
  checklist jsonb not null default '[]',
  status text not null default 'Planejamento',
  roi text default '',
  results text default '',
  materials jsonb not null default '[]',
  prospects jsonb not null default '[]',
  comments jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists demands (
  id text primary key,
  title text not null default '',
  description text default '',
  channel text,
  requester text default '',
  category text,
  priority text default 'Média',
  owner text default '',
  deadline date,
  impact text default 'Médio',
  status text not null default 'Nova',
  ai_note text default '',
  linked_type text default '',
  linked_id text default '',
  comments jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists suppliers (
  id text primary key,
  name text not null default '',
  brands jsonb not null default '[]',
  representative text default '',
  email text default '',
  phone text default '',
  annual_budget numeric,
  transactions jsonb not null default '[]',
  notes text default '',
  created_at timestamptz not null default now()
);

create table if not exists events (
  id text primary key,
  title text not null default '',
  type text,
  date date,
  description text default ''
);

create table if not exists team_members (
  id text primary key,
  name text not null default '',
  role text default '',
  email text default '',
  phone text default '',
  skills jsonb not null default '[]',
  vacation_start date,
  vacation_end date,
  goals text default '',
  feedbacks jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create index if not exists idx_projects_status on projects (status);
create index if not exists idx_projects_deadline on projects (deadline);
create index if not exists idx_campaigns_status on campaigns (status);
create index if not exists idx_demands_status on demands (status);
create index if not exists idx_demands_deadline on demands (deadline);

-- RLS habilitado, sem policies: a chave anônima/pública do Supabase não consegue ler nem
-- escrever nessas tabelas. Todo o acesso passa pelas rotas /api/* do Next.js, que usam a
-- SUPABASE_SERVICE_ROLE_KEY (somente no servidor) e ignoram RLS por padrão.
alter table projects enable row level security;
alter table campaigns enable row level security;
alter table demands enable row level security;
alter table suppliers enable row level security;
alter table events enable row level security;
alter table team_members enable row level security;
