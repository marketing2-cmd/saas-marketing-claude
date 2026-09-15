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

-- ============================================================================
-- AUTENTICAÇÃO E APROVAÇÃO DE CADASTROS
-- ============================================================================
--
-- Login com e-mail/senha via Supabase Auth. Todo novo cadastro nasce com
-- status 'pending' e só ganha acesso ao app quando um admin aprova
-- (ver /api/admin/approve). O e-mail abaixo é aprovado e promovido a admin
-- automaticamente no primeiro cadastro — é o "bootstrap" da aprovação, já
-- que sem um admin aprovado ninguém consegue aprovar mais ninguém.

create schema if not exists private;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  role text not null default 'member' check (role in ('member', 'admin')),
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references auth.users (id)
);

create index if not exists idx_profiles_status on public.profiles (status);

alter table public.profiles enable row level security;

-- Helper de RLS: roda como SECURITY DEFINER (bypassa RLS ao consultar profiles,
-- evitando recursão) e só responde sobre o próprio usuário autenticado — nunca
-- recebe parâmetros de fora, então não há como usá-lo para checar outra pessoa.
-- Fica no schema "private" (não exposto pela Data API) e sem GRANT para anon,
-- então não pode ser chamado via RPC — só é alcançável de dentro de uma policy.
create or replace function private.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

create policy "profiles_select_admin" on public.profiles
  for select to authenticated
  using ((select private.is_admin()));

-- Sem policy de insert/update para authenticated: a linha em profiles nasce
-- só pelo trigger abaixo (SECURITY DEFINER) e só é alterada (aprovar/rejeitar)
-- pelas rotas /api/admin/* do servidor, com a service role key.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, status, role, approved_at)
  values (
    new.id,
    new.email,
    case when new.email = 'marketing2@contattos.com' then 'approved' else 'pending' end,
    case when new.email = 'marketing2@contattos.com' then 'admin' else 'member' end,
    case when new.email = 'marketing2@contattos.com' then now() else null end
  );
  return new;
end;
$$;

-- Função de trigger: só é invocável pelo próprio disparo do INSERT em
-- auth.users (o motor do Postgres não passa pelo GRANT de EXECUTE do papel
-- que fez o INSERT para isso), então revogar EXECUTE de todo mundo é seguro
-- e fecha a única forma de alguém chamá-la diretamente como RPC.
revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- SORTEIO — cadastro de participantes
-- ============================================================================
--
-- Página pública em /sorteio: o cliente informa nome, celular, CPF, e-mail,
-- número da nota fiscal e data da compra; a rota /api/sorteio valida os dados,
-- gera um número da sorte aleatório e único e devolve na hora para o cliente.
-- Sem policies de RLS (igual às tabelas de dados no topo deste arquivo): só a
-- service role key (usada pela rota /api/sorteio) lê/grava aqui — o admin vê a
-- lista em /admin/sorteio.

create table if not exists raffle_entries (
  id text primary key,
  name text not null,
  phone text not null,
  cpf text not null,
  email text not null,
  receipt_number text not null,
  purchase_date date not null,
  raffle_number text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists idx_raffle_entries_created_at on raffle_entries (created_at);
create index if not exists idx_raffle_entries_cpf on raffle_entries (cpf);

alter table raffle_entries enable row level security;
