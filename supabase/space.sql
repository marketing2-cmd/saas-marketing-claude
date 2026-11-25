-- ============================================================================
-- space mais — schema (rodar DEPOIS de supabase/schema.sql, que cria profiles,
-- o schema "private" e o fluxo de aprovação de cadastros).
-- ============================================================================
--
-- Conceitos (de propósito poucos, para facilitar a adoção):
--   setor      → departamento da Contattos+ (Marketing, Comercial, Financeiro…)
--   projeto    → conjunto de tarefas de um setor
--   tarefa     → pode ter projeto ou não; se "requested_by_sector_id" estiver
--                preenchido, é um PEDIDO de outro setor (integração entre setores)
--   rotina     → atividade recorrente (diária/semanal/mensal) com check por período
--   ata        → registro de reunião; encaminhamentos viram tarefas (source_minute_id)
--   canal/msg  → chat interno, com ponte opcional para um espaço do Google Chat
--
-- Acesso: qualquer usuário APROVADO (profiles.status = 'approved' ou admin) lê e
-- escreve tudo — é uma ferramenta interna e colaborativa. A única exceção é
-- sm_channel_integrations (URL do webhook do Google Chat, que é um segredo):
-- só o servidor (service role) lê; só admin grava, via rota /api/space/admin/*.

create or replace function private.is_approved()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and (status = 'approved' or role = 'admin')
  );
$$;

revoke all on function private.is_approved() from public, anon;
grant execute on function private.is_approved() to authenticated;

-- Pessoas ------------------------------------------------------------------
create table if not exists public.sm_sectors (
  id text primary key,
  name text not null,
  color text not null default '#0038FF',
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.sm_members (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  email text not null default '',
  sector_id text references public.sm_sectors (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_sm_members_sector on public.sm_members (sector_id);

-- Projetos e tarefas ---------------------------------------------------------
create table if not exists public.sm_projects (
  id text primary key,
  sector_id text not null references public.sm_sectors (id) on delete cascade,
  name text not null,
  description text not null default '',
  color text not null default '#0038FF',
  archived boolean not null default false,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_sm_projects_sector on public.sm_projects (sector_id);

create table if not exists public.sm_minutes (
  id text primary key,
  sector_id text references public.sm_sectors (id) on delete set null,
  title text not null default '',
  meeting_date date not null default current_date,
  participants uuid[] not null default '{}',
  notes text not null default '',
  decisions text not null default '',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_sm_minutes_sector on public.sm_minutes (sector_id);

create table if not exists public.sm_tasks (
  id text primary key,
  title text not null default '',
  description text not null default '',
  sector_id text references public.sm_sectors (id) on delete set null,
  project_id text references public.sm_projects (id) on delete cascade,
  requested_by_sector_id text references public.sm_sectors (id) on delete set null,
  source_minute_id text references public.sm_minutes (id) on delete set null,
  status text not null default 'todo' check (status in ('todo', 'doing', 'review', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  assignee_id uuid references auth.users (id) on delete set null,
  due_date date,
  checklist jsonb not null default '[]',
  position double precision not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists idx_sm_tasks_project on public.sm_tasks (project_id);
create index if not exists idx_sm_tasks_sector on public.sm_tasks (sector_id);
create index if not exists idx_sm_tasks_assignee on public.sm_tasks (assignee_id);
create index if not exists idx_sm_tasks_requested_by on public.sm_tasks (requested_by_sector_id);
create index if not exists idx_sm_tasks_minute on public.sm_tasks (source_minute_id);

create table if not exists public.sm_task_comments (
  id text primary key,
  task_id text not null references public.sm_tasks (id) on delete cascade,
  author_id uuid references auth.users (id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_sm_task_comments_task on public.sm_task_comments (task_id);

-- Rotinas ------------------------------------------------------------------
create table if not exists public.sm_routines (
  id text primary key,
  sector_id text references public.sm_sectors (id) on delete cascade,
  title text not null,
  assignee_id uuid references auth.users (id) on delete set null,
  frequency text not null default 'daily' check (frequency in ('daily', 'weekly', 'monthly')),
  weekday int check (weekday between 0 and 6),        -- semanal: 0=domingo … 6=sábado
  month_day int check (month_day between 1 and 31),   -- mensal: dia do mês
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_sm_routines_sector on public.sm_routines (sector_id);

-- id = "<routine_id>:<period_key>" (ex.: "r1:2026-11-25", "r2:2026-W48", "r3:2026-11")
-- garante um único check por rotina por período.
create table if not exists public.sm_routine_checks (
  id text primary key,
  routine_id text not null references public.sm_routines (id) on delete cascade,
  period_key text not null,
  done_by uuid references auth.users (id) on delete set null,
  done_at timestamptz not null default now()
);
create index if not exists idx_sm_routine_checks_routine on public.sm_routine_checks (routine_id);

-- Chat ---------------------------------------------------------------------
create table if not exists public.sm_channels (
  id text primary key,
  name text not null,
  sector_id text references public.sm_sectors (id) on delete cascade,
  google_space_label text not null default '',   -- só o nome exibido; o segredo fica abaixo
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_sm_channels_sector on public.sm_channels (sector_id);

create table if not exists public.sm_channel_integrations (
  channel_id text primary key references public.sm_channels (id) on delete cascade,
  google_webhook_url text not null default '',   -- envio: space mais → Google Chat
  google_space_name text not null default '',    -- recebimento: "spaces/AAAA…" → este canal
  updated_at timestamptz not null default now()
);
create unique index if not exists idx_sm_channel_integrations_space
  on public.sm_channel_integrations (google_space_name) where google_space_name <> '';

create table if not exists public.sm_messages (
  id text primary key,
  channel_id text not null references public.sm_channels (id) on delete cascade,
  author_id uuid references auth.users (id) on delete set null,
  author_name text not null default '',
  body text not null,
  source text not null default 'space' check (source in ('space', 'google_chat')),
  created_at timestamptz not null default now()
);
create index if not exists idx_sm_messages_channel_created on public.sm_messages (channel_id, created_at);

-- RLS ----------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'sm_sectors', 'sm_projects', 'sm_minutes', 'sm_tasks', 'sm_task_comments',
    'sm_routines', 'sm_routine_checks', 'sm_channels'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "%s_approved_all" on public.%I', t, t);
    execute format(
      'create policy "%s_approved_all" on public.%I for all to authenticated
         using ((select private.is_approved())) with check ((select private.is_approved()))', t, t);
  end loop;
end $$;

-- Membros: todos os aprovados veem todos; cada um só cria/edita o próprio cadastro.
alter table public.sm_members enable row level security;
drop policy if exists "sm_members_select" on public.sm_members;
create policy "sm_members_select" on public.sm_members for select to authenticated
  using ((select private.is_approved()));
drop policy if exists "sm_members_insert_own" on public.sm_members;
create policy "sm_members_insert_own" on public.sm_members for insert to authenticated
  with check ((select auth.uid()) = id and (select private.is_approved()));
drop policy if exists "sm_members_update_own" on public.sm_members;
create policy "sm_members_update_own" on public.sm_members for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Mensagens: leitura para aprovados; o envio passa pela rota /api/space/chat/send
-- (service role), que também repassa ao Google Chat — sem insert direto do navegador.
alter table public.sm_messages enable row level security;
drop policy if exists "sm_messages_select" on public.sm_messages;
create policy "sm_messages_select" on public.sm_messages for select to authenticated
  using ((select private.is_approved()));

-- Integrações: RLS ligado e nenhuma policy → só a service role acessa.
alter table public.sm_channel_integrations enable row level security;

-- Realtime: o app escuta mudanças nestas tabelas para atualizar a tela de todos.
do $$
declare t text;
begin
  foreach t in array array[
    'sm_sectors', 'sm_members', 'sm_projects', 'sm_minutes', 'sm_tasks', 'sm_task_comments',
    'sm_routines', 'sm_routine_checks', 'sm_channels', 'sm_messages'
  ] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- Dados iniciais: setores e canais (edite à vontade) ------------------------
insert into public.sm_sectors (id, name, color, position) values
  ('marketing',  'Marketing',  '#0038FF', 1),
  ('comercial',  'Comercial',  '#00A86B', 2),
  ('financeiro', 'Financeiro', '#F2A100', 3),
  ('operacoes',  'Operações',  '#7B3FF2', 4),
  ('rh',         'Pessoas/RH', '#E23744', 5)
on conflict (id) do nothing;

insert into public.sm_channels (id, name, sector_id, position) values
  ('geral', 'geral', null, 0),
  ('ch-marketing', 'marketing', 'marketing', 1),
  ('ch-comercial', 'comercial', 'comercial', 2),
  ('ch-financeiro', 'financeiro', 'financeiro', 3),
  ('ch-operacoes', 'operacoes', 'operacoes', 4),
  ('ch-rh', 'pessoas', 'rh', 5)
on conflict (id) do nothing;
