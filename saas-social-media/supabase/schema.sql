-- SaaS Social Media — schema do banco (Supabase / Postgres)
-- Rode este arquivo inteiro no SQL Editor do Supabase (projeto novo).
--
-- Modelo multi-tenant: cada conta (agência / social media) é um WORKSPACE.
-- Tudo (clientes, posts, comentários, contas sociais) pertence a um workspace,
-- e o RLS só libera acesso a quem é membro dele.

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────
-- Tabelas
-- ─────────────────────────────────────────────────────────────

create table public.workspaces (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 120),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  -- dias antes da publicação em que cada etapa deve ficar pronta
  stage_deadlines jsonb not null default '{"theme":10,"content":7,"media":5,"caption":3}'::jsonb,
  created_at  timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         text not null default 'member' check (role in ('owner', 'member')),
  functions    text[] not null default '{}',   -- strategy, copy, design, video, management
  created_at   timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
create index workspace_members_user_idx on public.workspace_members(user_id);

-- Cadastros da plataforma: todo usuário novo nasce "pending" e só acessa depois
-- que um admin aprovar. O PRIMEIRO usuário criado vira admin (já aprovado).
create table public.platform_profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text not null default '',
  status      text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now(),
  reviewed_at timestamptz
);

create table public.clients (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references public.workspaces(id) on delete cascade,
  name            text not null check (char_length(name) between 1 and 120),
  instagram_handle text,
  color           text not null default '#6D4AFF',
  notes           text,
  avatar_url      text,   -- foto de perfil (Storage: <workspace>/clients/<id>/...)
  cover_url       text,   -- imagem de capa
  niche           text,
  contact_name    text,
  contact_phone   text,
  contact_email   text,
  document        text,   -- CPF/CNPJ
  contract_status text not null default 'active' check (contract_status in ('active', 'negotiation', 'paused', 'ended')),
  monthly_fee     numeric(12,2) check (monthly_fee is null or monthly_fee >= 0),
  billing_day     smallint check (billing_day is null or billing_day between 1 and 31),
  payment_method  text,
  contract_start  date,
  contract_end    date,
  services        text[] not null default '{}',
  contract_path   text,   -- arquivo no bucket PRIVADO "contracts"
  default_team    jsonb not null default '{}'::jsonb,  -- responsável padrão por etapa: { theme|content|media|caption: user_id }
  -- Token do link público de aprovação (portal do cliente: /c/<token>)
  approval_token  uuid not null unique default gen_random_uuid(),
  created_at      timestamptz not null default now()
);
create index clients_workspace_idx on public.clients(workspace_id);

create type public.post_status as enum (
  'draft',              -- Rascunho
  'in_review',          -- Em aprovação (cliente vê no portal)
  'changes_requested',  -- Ajuste pedido pelo cliente
  'approved',           -- Aprovado (sem data definida)
  'scheduled',          -- Aprovado + com data → será publicado pelo cron
  'publishing',         -- O cron está publicando agora (trava contra publicação dupla)
  'published',          -- Publicado
  'failed'              -- Falhou ao publicar
);

create table public.posts (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  client_id     uuid not null references public.clients(id) on delete cascade,
  title         text not null default '',
  caption       text not null default '',
  format        text not null default 'feed' check (format in ('feed', 'carousel', 'reels', 'story')),
  networks      text[] not null default array['instagram'],
  tags          text[] not null default '{}',
  -- [{ "path": "...", "url": "https://...", "type": "image" | "video" }]
  media         jsonb not null default '[]'::jsonb,
  status        public.post_status not null default 'draft',
  scheduled_at  timestamptz,
  published_at  timestamptz,
  external_id   text,
  publish_error text,
  publish_attempts int not null default 0,
  theme           text not null default '',          -- etapa "Tema": ideia/tema da publicação
  reference_links text[] not null default '{}',      -- até 3 links de referência
  content_text    text not null default '',          -- etapa "Conteúdo": texto da arte / roteiro
  designer_notes  text not null default '',
  reels_share_to_feed boolean not null default true, -- Reels: também aparece no feed
  reels_cover     jsonb,                             -- Reels: imagem de capa { path, url, type }
  publish_container_id text,                         -- container da Meta ainda processando (vídeo)
  publish_container_at timestamptz,
  stages          jsonb not null default '{}'::jsonb, -- { theme|content|media|caption: { status, assignee } }
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index posts_workspace_idx on public.posts(workspace_id);
create index posts_client_idx on public.posts(client_id);
create index posts_due_idx on public.posts(scheduled_at) where status = 'scheduled';

create table public.post_comments (
  id           uuid primary key default gen_random_uuid(),
  post_id      uuid not null references public.posts(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  author_type  text not null check (author_type in ('team', 'client')),
  author_name  text not null default '',
  stage        text,   -- etapa a que o comentário se refere (theme, content, media, caption)
  body         text not null check (char_length(body) between 1 and 4000),
  created_at   timestamptz not null default now()
);
create index post_comments_post_idx on public.post_comments(post_id);

-- Contas sociais conectadas (Instagram via Meta). Guarda tokens de acesso:
-- o navegador só enxerga as colunas sem token (ver grants mais abaixo).
create table public.social_accounts (
  id               uuid primary key default gen_random_uuid(),
  workspace_id     uuid not null references public.workspaces(id) on delete cascade,
  client_id        uuid not null references public.clients(id) on delete cascade,
  provider         text not null check (provider in ('instagram')),
  external_user_id text not null,        -- ID da conta profissional do Instagram
  page_id          text,                 -- Página do Facebook vinculada
  username         text,
  access_token     text not null,
  token_expires_at timestamptz,
  created_at       timestamptz not null default now(),
  unique (client_id, provider)
);

-- ─────────────────────────────────────────────────────────────
-- Funções auxiliares
-- ─────────────────────────────────────────────────────────────

-- security definer: evita recursão de RLS ao checar workspace_members
-- Funções auxiliares ficam no schema "private", que a API do Supabase não expõe
create schema if not exists private;
grant usage on schema private to authenticated;

create or replace function private.is_member(ws uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members m
    join public.platform_profiles p on p.id = m.user_id
    where m.workspace_id = ws
      and m.user_id = (select auth.uid())
      and p.status = 'approved'
  );
$$;

create or replace function private.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.platform_profiles p where p.id = (select auth.uid()) and p.is_admin);
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  first_user boolean;
  invited boolean := false;
  inv record;
begin
  perform pg_advisory_xact_lock(hashtext('platform_profiles_first_user'));
  select not exists (select 1 from public.platform_profiles) into first_user;
  insert into public.platform_profiles (id, email, full_name, status, is_admin, reviewed_at)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    case when first_user then 'approved' else 'pending' end,
    first_user,
    case when first_user then now() end
  );
  -- Convidados entram aprovados e já no espaço de quem convidou
  for inv in
    select * from public.workspace_invites where email = lower(coalesce(new.email, '')) and accepted_at is null
  loop
    insert into public.workspace_members (workspace_id, user_id, role, functions)
    values (inv.workspace_id, new.id, 'member', inv.functions)
    on conflict (workspace_id, user_id) do nothing;
    update public.workspace_invites set accepted_at = now() where id = inv.id;
    invited := true;
  end loop;
  if invited then
    update public.platform_profiles set status = 'approved', reviewed_at = now() where id = new.id and status = 'pending';
  end if;
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Cria o workspace do usuário logado e o adiciona como owner (onboarding)
create or replace function public.create_workspace(ws_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'not authenticated';
  end if;
  if not exists (
    select 1 from public.platform_profiles p
    where p.id = (select auth.uid()) and p.status = 'approved'
  ) then
    raise exception 'account not approved';
  end if;
  insert into public.workspaces (name, owner_id)
  values (ws_name, (select auth.uid()))
  returning id into new_id;
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new_id, (select auth.uid()), 'owner');
  return new_id;
end;
$$;
revoke execute on function public.create_workspace(text) from public, anon;
grant execute on function public.create_workspace(text) to authenticated;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger posts_touch before update on public.posts
for each row execute function public.touch_updated_at();

-- Garante que client_id e workspace_id do post batem (não dá para criar
-- post de um workspace apontando para cliente de outro)
create or replace function private.check_post_client()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.clients c
    where c.id = new.client_id and c.workspace_id = new.workspace_id
  ) then
    raise exception 'client does not belong to workspace';
  end if;
  return new;
end;
$$;
create trigger posts_check_client before insert or update of client_id, workspace_id on public.posts
for each row execute function private.check_post_client();
revoke execute on function private.check_post_client() from public, anon, authenticated;

revoke execute on function private.is_member(uuid) from public, anon;
grant execute on function private.is_member(uuid) to authenticated;
revoke execute on function private.is_platform_admin() from public, anon;
grant execute on function private.is_platform_admin() to authenticated;
revoke execute on function private.handle_new_user() from public, anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────

alter table public.platform_profiles enable row level security;
alter table public.workspaces        enable row level security;
alter table public.workspace_members enable row level security;
alter table public.clients           enable row level security;
alter table public.posts             enable row level security;
alter table public.post_comments     enable row level security;
alter table public.social_accounts   enable row level security;

-- platform_profiles: cada um lê o próprio; admin lê todos. Aprovação só pelo
-- servidor (service role) — sem policies de escrita.
create policy platform_profiles_select on public.platform_profiles
  for select to authenticated
  using (id = (select auth.uid()) or private.is_platform_admin());
revoke insert, update, delete on public.platform_profiles from anon, authenticated;

create policy workspaces_select on public.workspaces
  for select to authenticated using (private.is_member(id));
create policy workspaces_update on public.workspaces
  for update to authenticated using (owner_id = (select auth.uid()));

create policy members_select on public.workspace_members
  for select to authenticated using (private.is_member(workspace_id));

create policy clients_all on public.clients
  for all to authenticated
  using (private.is_member(workspace_id))
  with check (private.is_member(workspace_id));

create policy posts_all on public.posts
  for all to authenticated
  using (private.is_member(workspace_id))
  with check (private.is_member(workspace_id));

create policy comments_select on public.post_comments
  for select to authenticated using (private.is_member(workspace_id));
create policy comments_insert on public.post_comments
  for insert to authenticated
  with check (private.is_member(workspace_id) and author_type = 'team');

-- social_accounts: membros leem só as colunas SEM o access_token (grant por
-- coluna). Escrita e leitura do token: só o servidor (service role).
revoke all on public.social_accounts from anon, authenticated;
grant select (id, workspace_id, client_id, provider, username, token_expires_at, created_at)
  on public.social_accounts to authenticated;
create policy social_accounts_select on public.social_accounts
  for select to authenticated using (private.is_member(workspace_id));

create view public.social_accounts_public with (security_invoker = true) as
  select id, workspace_id, client_id, provider, username, token_expires_at, created_at
  from public.social_accounts;
revoke all on public.social_accounts_public from anon;
grant select on public.social_accounts_public to authenticated;

-- ─────────────────────────────────────────────────────────────
-- Storage: bucket público "media" (a API do Instagram exige URL pública
-- da imagem/vídeo). Arquivos ficam em <workspace_id>/<arquivo>.
-- ─────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit)
values ('media', 'media', true, 104857600)
on conflict (id) do nothing;

create policy media_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'media'
    and private.is_member(((storage.foldername(name))[1])::uuid)
  );
create policy media_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'media'
    and private.is_member(((storage.foldername(name))[1])::uuid)
  );
create policy media_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'media'
    and private.is_member(((storage.foldername(name))[1])::uuid)
  );

-- ─────────────────────────────────────────────────────────────
-- Planejamento por cliente: linha editorial, cronograma, planos
-- mensais e mural de ideias/insights
-- ─────────────────────────────────────────────────────────────

create table public.client_strategy (
  client_id       uuid primary key references public.clients(id) on delete cascade,
  workspace_id    uuid not null references public.workspaces(id) on delete cascade,
  goals           text not null default '',
  audience        text not null default '',
  tone            text not null default '',
  dos             text not null default '',
  donts           text not null default '',
  pillars         jsonb not null default '[]'::jsonb,          -- [{ id, name, description, color, share }]
  weekly_schedule jsonb not null default '[]'::jsonb,          -- [{ id, weekday, time, format, pillar_id, note }]
  value_proposition text not null default '',
  differentials   text not null default '',
  diagnosis       jsonb not null default '{}'::jsonb,          -- { summary, current_situation, strengths, weaknesses, opportunities, threats }
  personas        jsonb not null default '[]'::jsonb,          -- [{ id, name, age, occupation, pains, desires, objections, channels, quote }]
  competitors     jsonb not null default '[]'::jsonb,          -- [{ id, name, handle, link, strengths, weaknesses, notes }]
  products        jsonb not null default '[]'::jsonb,          -- [{ id, name, price, description, differential, link }]
  section_visibility jsonb not null default '{}'::jsonb,       -- seções visíveis no portal: { diagnosis: "shared", ... }
  updated_at      timestamptz not null default now()
);

create table public.client_monthly_plans (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references public.clients(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  month        date not null check (extract(day from month) = 1),
  theme        text not null default '',
  goals        text not null default '',
  weeks        jsonb not null default '[]'::jsonb,             -- ["foco semana 1", ...]
  key_dates    jsonb not null default '[]'::jsonb,             -- [{ id, date, title }]
  updated_at   timestamptz not null default now(),
  unique (client_id, month)
);

create table public.client_notes (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references public.clients(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  kind         text not null default 'idea' check (kind in ('idea', 'insight', 'reference')),
  title        text not null default '',
  body         text not null default '',
  link         text,
  pillar_id    text,
  status       text not null default 'new' check (status in ('new', 'approved', 'used', 'discarded')),
  pinned       boolean not null default false,
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index client_notes_client_idx on public.client_notes(client_id, created_at desc);
create index client_monthly_plans_ws_idx on public.client_monthly_plans(workspace_id);
create index client_notes_ws_idx on public.client_notes(workspace_id);
create index client_strategy_ws_idx on public.client_strategy(workspace_id);

create trigger client_strategy_check_client before insert or update of client_id, workspace_id on public.client_strategy
  for each row execute function private.check_post_client();
create trigger client_monthly_plans_check_client before insert or update of client_id, workspace_id on public.client_monthly_plans
  for each row execute function private.check_post_client();
create trigger client_notes_check_client before insert or update of client_id, workspace_id on public.client_notes
  for each row execute function private.check_post_client();

create trigger client_strategy_touch before update on public.client_strategy
  for each row execute function public.touch_updated_at();
create trigger client_monthly_plans_touch before update on public.client_monthly_plans
  for each row execute function public.touch_updated_at();
create trigger client_notes_touch before update on public.client_notes
  for each row execute function public.touch_updated_at();

alter table public.client_strategy      enable row level security;
alter table public.client_monthly_plans enable row level security;
alter table public.client_notes         enable row level security;

create policy client_strategy_all on public.client_strategy for all to authenticated
  using (private.is_member(workspace_id)) with check (private.is_member(workspace_id));
create policy client_monthly_plans_all on public.client_monthly_plans for all to authenticated
  using (private.is_member(workspace_id)) with check (private.is_member(workspace_id));
create policy client_notes_all on public.client_notes for all to authenticated
  using (private.is_member(workspace_id)) with check (private.is_member(workspace_id));

-- Contratos: bucket PRIVADO. Arquivos em <workspace_id>/<client_id>/<arquivo>.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('contracts', 'contracts', false, 20971520, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy contracts_select on storage.objects for select to authenticated
  using (bucket_id = 'contracts' and private.is_member(((storage.foldername(name))[1])::uuid));
create policy contracts_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'contracts' and private.is_member(((storage.foldername(name))[1])::uuid));
create policy contracts_update on storage.objects for update to authenticated
  using (bucket_id = 'contracts' and private.is_member(((storage.foldername(name))[1])::uuid));
create policy contracts_delete on storage.objects for delete to authenticated
  using (bucket_id = 'contracts' and private.is_member(((storage.foldername(name))[1])::uuid));

-- ─────────────────────────────────────────────────────────────
-- Equipe: convites, funções, permissões do dono
-- ─────────────────────────────────────────────────────────────

create or replace function private.is_owner(ws uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.workspace_members m
    join public.platform_profiles p on p.id = m.user_id
    where m.workspace_id = ws and m.user_id = (select auth.uid()) and m.role = 'owner' and p.status = 'approved'
  );
$$;
revoke execute on function private.is_owner(uuid) from public, anon;
grant execute on function private.is_owner(uuid) to authenticated;

create policy members_update on public.workspace_members for update to authenticated
  using (private.is_owner(workspace_id)) with check (private.is_owner(workspace_id));
create policy members_delete on public.workspace_members for delete to authenticated
  using (private.is_owner(workspace_id) and role <> 'owner');

create table public.workspace_invites (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email        text not null check (email = lower(email)),
  functions    text[] not null default '{}',
  invited_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  accepted_at  timestamptz,
  unique (workspace_id, email)
);
create index workspace_invites_email_idx on public.workspace_invites(email) where accepted_at is null;
alter table public.workspace_invites enable row level security;
create policy invites_select on public.workspace_invites for select to authenticated using (private.is_member(workspace_id));
create policy invites_delete on public.workspace_invites for delete to authenticated using (private.is_owner(workspace_id));

create or replace function public.workspace_member_list(ws uuid)
returns table (user_id uuid, email text, full_name text, role text, functions text[], joined_at timestamptz)
language sql stable security definer set search_path = ''
as $$
  select m.user_id, p.email, p.full_name, m.role, m.functions, m.created_at
  from public.workspace_members m
  join public.platform_profiles p on p.id = m.user_id
  where m.workspace_id = ws and private.is_member(ws)
  order by m.created_at;
$$;
revoke execute on function public.workspace_member_list(uuid) from public, anon;
grant execute on function public.workspace_member_list(uuid) to authenticated;

create or replace function public.invite_member(ws uuid, invite_email text, member_functions text[])
returns text language plpgsql security definer set search_path = ''
as $$
declare
  e text := lower(trim(invite_email));
  uid uuid;
  st text;
begin
  if not private.is_owner(ws) then raise exception 'Apenas o dono do espaço pode convidar.'; end if;
  if e !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then raise exception 'E-mail inválido.'; end if;
  select u.id into uid from auth.users u where lower(u.email) = e limit 1;
  if uid is not null then
    select p.status into st from public.platform_profiles p where p.id = uid;
    if st = 'rejected' then raise exception 'Este e-mail está bloqueado na plataforma.'; end if;
    insert into public.workspace_members (workspace_id, user_id, role, functions)
    values (ws, uid, 'member', coalesce(member_functions, '{}'))
    on conflict (workspace_id, user_id) do update set functions = excluded.functions;
    update public.platform_profiles set status = 'approved', reviewed_at = now() where id = uid and status = 'pending';
    return 'added';
  end if;
  insert into public.workspace_invites (workspace_id, email, functions, invited_by)
  values (ws, e, coalesce(member_functions, '{}'), (select auth.uid()))
  on conflict (workspace_id, email) do update set functions = excluded.functions, accepted_at = null;
  return 'invited';
end;
$$;
revoke execute on function public.invite_member(uuid, text, text[]) from public, anon;
grant execute on function public.invite_member(uuid, text, text[]) to authenticated;

-- ─────────────────────────────────────────────────────────────
-- Notificações (geradas por triggers)
-- ─────────────────────────────────────────────────────────────

create table public.notifications (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  kind         text not null,
  title        text not null,
  body         text not null default '',
  post_id      uuid references public.posts(id) on delete cascade,
  client_id    uuid references public.clients(id) on delete cascade,
  stage        text,
  actor        text not null default '',
  is_mention   boolean not null default false,
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);
create index notifications_user_idx on public.notifications(user_id, created_at desc);
create index notifications_unread_idx on public.notifications(user_id) where read_at is null;
create index notifications_ws_idx on public.notifications(workspace_id);
create index notifications_post_idx on public.notifications(post_id);
create index notifications_client_idx on public.notifications(client_id);
alter table public.notifications enable row level security;
create policy notifications_select on public.notifications for select to authenticated
  using (user_id = (select auth.uid()) and private.is_member(workspace_id));
create policy notifications_update on public.notifications for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
revoke insert, update, delete on public.notifications from anon, authenticated;
grant update (read_at) on public.notifications to authenticated;

create or replace function private.stage_assignee(stages jsonb, k text)
returns uuid language sql immutable set search_path = ''
as $$
  select case
    when (stages -> k ->> 'assignee') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then (stages -> k ->> 'assignee')::uuid end;
$$;

-- Uma notificação para cada membro (ou só only_user), exceto skip_user
create or replace function private.notify(
  ws uuid, only_user uuid, mention_user uuid, n_kind text, n_title text, n_body text,
  n_post uuid, n_client uuid, n_stage text, n_actor text, skip_user uuid
) returns void language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.notifications (workspace_id, user_id, kind, title, body, post_id, client_id, stage, actor, is_mention)
  select ws, m.user_id, n_kind, n_title, coalesce(left(n_body, 500), ''), n_post, n_client, n_stage, coalesce(n_actor, ''),
         coalesce(m.user_id = mention_user, false)
  from public.workspace_members m
  where m.workspace_id = ws
    and (only_user is null or m.user_id = only_user)
    and (skip_user is null or m.user_id <> skip_user);
end;
$$;

-- Comentário do cliente → equipe toda (menção ao responsável da etapa);
-- comentário da equipe numa etapa → só o responsável dela
create or replace function private.on_comment_notify()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  p record;
  cname text;
  assignee uuid;
  labels jsonb := '{"theme":"Tema","content":"Conteúdo","media":"Mídia","caption":"Legenda"}';
  ptitle text;
begin
  select * into p from public.posts where id = new.post_id;
  if not found then return new; end if;
  select name into cname from public.clients where id = p.client_id;
  ptitle := coalesce(nullif(p.title, ''), nullif(split_part(p.theme, E'\n', 1), ''), 'Conteúdo');
  if new.stage is not null then assignee := private.stage_assignee(p.stages, new.stage); end if;

  if new.author_type = 'client' then
    perform private.notify(new.workspace_id, null, assignee, 'client_comment',
      cname || ' comentou' || coalesce(' em ' || (labels ->> new.stage), ''),
      ptitle || ': ' || new.body, p.id, p.client_id, new.stage,
      coalesce(nullif(new.author_name, ''), cname), null);
  elsif assignee is not null and assignee is distinct from (select auth.uid()) then
    perform private.notify(new.workspace_id, assignee, assignee, 'team_comment',
      'Comentário em ' || coalesce(labels ->> new.stage, 'conteúdo'),
      ptitle || ': ' || new.body, p.id, p.client_id, new.stage, new.author_name, null);
  end if;
  return new;
end;
$$;
create trigger post_comments_notify after insert on public.post_comments
  for each row execute function private.on_comment_notify();

-- Post: aprovação/ajuste do cliente (feito sem usuário logado = portal),
-- publicação, falha, nova atribuição e "sua vez"
create or replace function private.on_post_notify()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  keys text[] := array['theme', 'content', 'media', 'caption'];
  labels text[] := array['Tema', 'Conteúdo', 'Mídia', 'Legenda'];
  cname text;
  ptitle text;
  i int;
  o text;
  n text;
  na uuid;
  nxt uuid;
  approved text[] := '{}';
  changes text[] := '{}';
  mention uuid;
begin
  select name into cname from public.clients where id = new.client_id;
  ptitle := coalesce(nullif(new.title, ''), nullif(split_part(new.theme, E'\n', 1), ''), 'Conteúdo');

  if new.status is distinct from old.status then
    if new.status = 'published' then
      perform private.notify(new.workspace_id, null, null, 'published', 'Post publicado no Instagram',
        cname || ' · ' || ptitle, new.id, new.client_id, null, 'Sistema', null);
    elsif new.status = 'failed' then
      perform private.notify(new.workspace_id, null, null, 'publish_failed', 'Falha ao publicar',
        cname || ' · ' || ptitle || coalesce(' — ' || new.publish_error, ''), new.id, new.client_id, null, 'Sistema', null);
    end if;
  end if;

  for i in 1..4 loop
    o := coalesce(old.stages -> keys[i] ->> 'status', '');
    n := coalesce(new.stages -> keys[i] ->> 'status', '');
    na := private.stage_assignee(new.stages, keys[i]);

    if n is distinct from o then
      if actor is null and n = 'approved' then
        approved := approved || labels[i];
        mention := coalesce(mention, na);
      elsif actor is null and n = 'changes_requested' then
        changes := changes || labels[i];
        mention := coalesce(na, mention);
      end if;
      if n = 'approved' and i < 4 then
        nxt := private.stage_assignee(new.stages, keys[i + 1]);
        if nxt is not null and nxt is distinct from actor
           and coalesce(new.stages -> keys[i + 1] ->> 'status', 'draft') in ('draft', '') then
          perform private.notify(new.workspace_id, nxt, nxt, 'your_turn', 'Sua vez: ' || labels[i + 1],
            cname || ' · ' || ptitle || ' (' || labels[i] || ' aprovado)', new.id, new.client_id, keys[i + 1], 'Sistema', null);
        end if;
      end if;
    end if;

    if na is not null and na is distinct from private.stage_assignee(old.stages, keys[i]) and na is distinct from actor then
      perform private.notify(new.workspace_id, na, na, 'assigned', 'Nova tarefa: ' || labels[i],
        cname || ' · ' || ptitle, new.id, new.client_id, keys[i], '', null);
    end if;
  end loop;

  if array_length(changes, 1) > 0 then
    perform private.notify(new.workspace_id, null, mention, 'client_changes',
      cname || ' pediu ajuste em ' || array_to_string(changes, ', '), ptitle, new.id, new.client_id, null, cname, null);
  end if;
  if array_length(approved, 1) > 0 then
    perform private.notify(new.workspace_id, null, mention, 'client_approved',
      cname || ' aprovou ' || case when array_length(approved, 1) = 4 then 'o conteúdo' else array_to_string(approved, ', ') end,
      ptitle, new.id, new.client_id, null, cname, null);
  end if;
  return new;
end;
$$;
create trigger posts_notify after update of status, stages on public.posts
  for each row execute function private.on_post_notify();

revoke execute on function private.notify(uuid, uuid, uuid, text, text, text, uuid, uuid, text, text, uuid) from public, anon, authenticated;
revoke execute on function private.on_comment_notify() from public, anon, authenticated;
revoke execute on function private.on_post_notify() from public, anon, authenticated;
