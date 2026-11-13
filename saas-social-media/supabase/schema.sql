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
  created_at  timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         text not null default 'member' check (role in ('owner', 'member')),
  created_at   timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
create index workspace_members_user_idx on public.workspace_members(user_id);

create table public.clients (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references public.workspaces(id) on delete cascade,
  name            text not null check (char_length(name) between 1 and 120),
  instagram_handle text,
  color           text not null default '#6D4AFF',
  notes           text,
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
    select 1 from public.workspace_members m
    where m.workspace_id = ws and m.user_id = (select auth.uid())
  );
$$;

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

-- ─────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────

alter table public.workspaces        enable row level security;
alter table public.workspace_members enable row level security;
alter table public.clients           enable row level security;
alter table public.posts             enable row level security;
alter table public.post_comments     enable row level security;
alter table public.social_accounts   enable row level security;

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
