-- Verbas Contattos+ — gestão de verbas de fornecedores e campanhas de sell-out
--
-- O front-end (public/verbas.html) foi escrito como um artefato do Claude, que guarda
-- documentos JSON em coleções. Para manter o mesmo código, os dados ficam numa única
-- tabela de documentos: (collection, id) -> data jsonb. As coleções são:
--   fornecedores, ciclos, verbas, campanhas, eventos, equipe, pedidos, historico
--
-- Acesso: as rotas /api/verbas usam a sessão do usuário (publishable key + RLS),
-- então quem decide o que cada um pode ler e gravar são as policies abaixo.
--   * Ler: qualquer usuário aprovado (ou admin).
--   * fornecedores, ciclos, equipe: só admin grava.
--   * pedidos: cada pessoa grava só o próprio pedido (id = seu user id); admin grava todos.
--   * verbas, campanhas, eventos, historico: qualquer aprovado, exceto quem está na área Diretoria.
-- As regras por área (Comercial, Compras, Financeiro, Marketing) ficam na interface.

create table if not exists public.verbas_docs (
  collection text not null check (collection in ('fornecedores','ciclos','verbas','campanhas','eventos','equipe','pedidos','historico')),
  id text not null check (id ~ '^[A-Za-z0-9_.:@+~-]{1,200}$'),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid() references auth.users (id) on delete set null,
  primary key (collection, id)
);

create index if not exists idx_verbas_docs_updated_by on public.verbas_docs (updated_by);

alter table public.verbas_docs enable row level security;

grant select, insert, update, delete on public.verbas_docs to authenticated;
revoke all on public.verbas_docs from anon;

-- Helpers (schema private, não exposto pela Data API). SECURITY DEFINER para ler
-- profiles/verbas_docs sem recursão de RLS; só respondem sobre o próprio usuário.
create or replace function private.verbas_is_member()
returns boolean language sql security definer stable set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and (status = 'approved' or role = 'admin')
  );
$$;

create or replace function private.verbas_area()
returns text language sql security definer stable set search_path = '' as $$
  select data->>'area' from public.verbas_docs
  where collection = 'equipe' and id = (select auth.uid())::text;
$$;

create or replace function private.verbas_can_write(p_collection text, p_id text)
returns boolean language sql security definer stable set search_path = '' as $$
  select private.verbas_is_member() and case
    when p_collection in ('fornecedores','ciclos','equipe') then private.is_admin()
    when p_collection = 'pedidos' then p_id = (select auth.uid())::text or private.is_admin()
    when p_collection in ('verbas','campanhas','eventos','historico') then coalesce(private.verbas_area(), '') <> 'diretoria'
    else false
  end;
$$;

-- As policies chamam funções do schema private; o papel authenticated precisa de USAGE
-- nele (o schema continua fora da Data API, então nada dele vira endpoint).
grant usage on schema private to authenticated;

revoke all on function private.verbas_is_member() from public, anon;
revoke all on function private.verbas_area() from public, anon;
revoke all on function private.verbas_can_write(text, text) from public, anon;
grant execute on function private.verbas_is_member() to authenticated;
grant execute on function private.verbas_area() to authenticated;
grant execute on function private.verbas_can_write(text, text) to authenticated;

drop policy if exists "verbas_docs_select" on public.verbas_docs;
drop policy if exists "verbas_docs_insert" on public.verbas_docs;
drop policy if exists "verbas_docs_update" on public.verbas_docs;
drop policy if exists "verbas_docs_delete" on public.verbas_docs;

create policy "verbas_docs_select" on public.verbas_docs
  for select to authenticated
  using ((select private.verbas_is_member()));

create policy "verbas_docs_insert" on public.verbas_docs
  for insert to authenticated
  with check ((select private.verbas_can_write(collection, id)));

create policy "verbas_docs_update" on public.verbas_docs
  for update to authenticated
  using ((select private.verbas_can_write(collection, id)))
  with check ((select private.verbas_can_write(collection, id)));

create policy "verbas_docs_delete" on public.verbas_docs
  for delete to authenticated
  using ((select private.verbas_can_write(collection, id)));

-- Lista de pessoas aprovadas (id + e-mail) para mostrar nomes e escolher responsáveis.
-- Fica em public porque é chamada via RPC; só devolve algo para quem já é membro aprovado.
create or replace function public.verbas_people()
returns table (id uuid, email text, role text)
language sql security definer stable set search_path = '' as $$
  select p.id, p.email, p.role from public.profiles p
  where (p.status = 'approved' or p.role = 'admin')
    and private.verbas_is_member();
$$;

revoke all on function public.verbas_people() from public, anon;
grant execute on function public.verbas_people() to authenticated;

-- ============================================================================
-- Dados iniciais: fornecedores (compras 01/01 a 09/11/2026, valor contábil, sem fios
-- e cabos) e os 6 ciclos bimestrais de 2027. "on conflict do nothing" preserva edições.
-- ============================================================================
insert into public.verbas_docs (collection, id, data, updated_by) values
('fornecedores','weg','{"nome":"WEG","faixa":"A","compras2026":2261580,"categoria":"","obs":"","distribuidor":false,"ativo":true}',null),
('fornecedores','vellore','{"nome":"Vellore","faixa":"A","compras2026":1876959,"categoria":"","obs":"","distribuidor":false,"ativo":true}',null),
('fornecedores','nsa','{"nome":"NSA","faixa":"A","compras2026":1552888,"categoria":"","obs":"Distribuidor: a verba vem do repasse dos fabricantes.","distribuidor":true,"ativo":true}',null),
('fornecedores','soprano','{"nome":"Soprano","faixa":"A","compras2026":1489574,"categoria":"","obs":"","distribuidor":false,"ativo":true}',null),
('fornecedores','tramontina','{"nome":"Tramontina","faixa":"A","compras2026":1123708,"categoria":"","obs":"","distribuidor":false,"ativo":true}',null),
('fornecedores','mar-girius','{"nome":"Mar-Girius","faixa":"A","compras2026":1098336,"categoria":"","obs":"","distribuidor":false,"ativo":true}',null),
('fornecedores','blumenau-iluminacao','{"nome":"Blumenau Iluminação","faixa":"A","compras2026":1048914,"categoria":"","obs":"","distribuidor":false,"ativo":true}',null),
('fornecedores','eletrocal','{"nome":"Eletrocal","faixa":"B","compras2026":737507,"categoria":"","obs":"","distribuidor":false,"ativo":true}',null),
('fornecedores','piralux','{"nome":"Piralux","faixa":"B","compras2026":609200,"categoria":"","obs":"","distribuidor":false,"ativo":true}',null),
('fornecedores','eletrica-danubio','{"nome":"Elétrica Danúbio","faixa":"B","compras2026":571014,"categoria":"","obs":"Fornecedor novo, com compras desde agosto de 2026.","distribuidor":false,"ativo":true}',null),
('fornecedores','jf-mangueiras','{"nome":"J.F. Mangueiras","faixa":"B","compras2026":552532,"categoria":"","obs":"","distribuidor":false,"ativo":true}',null),
('fornecedores','ventex','{"nome":"Ventex","faixa":"B","compras2026":535200,"categoria":"","obs":"","distribuidor":false,"ativo":true}',null),
('fornecedores','clamper','{"nome":"Clamper","faixa":"B","compras2026":406829,"categoria":"","obs":"","distribuidor":false,"ativo":true}',null),
('fornecedores','lorenzetti','{"nome":"Lorenzetti","faixa":"B","compras2026":368921,"categoria":"","obs":"","distribuidor":false,"ativo":true}',null),
('fornecedores','embrastec','{"nome":"Embrastec","faixa":"B","compras2026":303072,"categoria":"","obs":"","distribuidor":false,"ativo":true}',null),
('fornecedores','belenus','{"nome":"Belenus","faixa":"C","compras2026":280032,"categoria":"","obs":"","distribuidor":false,"ativo":true}',null),
('fornecedores','intelli','{"nome":"Intelli","faixa":"C","compras2026":264070,"categoria":"","obs":"","distribuidor":false,"ativo":true}',null),
('fornecedores','gomes-metalurgica','{"nome":"Gomes Metalúrgica","faixa":"C","compras2026":263646,"categoria":"","obs":"","distribuidor":false,"ativo":true}',null),
('fornecedores','vkm','{"nome":"VKM","faixa":"C","compras2026":246551,"categoria":"","obs":"","distribuidor":false,"ativo":true}',null),
('fornecedores','route-66','{"nome":"Route 66","faixa":"C","compras2026":231115,"categoria":"","obs":"Distribuidor: a verba vem do repasse dos fabricantes.","distribuidor":true,"ativo":true}',null),
('fornecedores','ztn','{"nome":"ZTN","faixa":"C","compras2026":226515,"categoria":"","obs":"","distribuidor":false,"ativo":true}',null),
('fornecedores','fortlev','{"nome":"Fortlev","faixa":"C","compras2026":220716,"categoria":"","obs":"","distribuidor":false,"ativo":true}',null),
('fornecedores','wago','{"nome":"Wago","faixa":"C","compras2026":194218,"categoria":"","obs":"","distribuidor":false,"ativo":true}',null),
('fornecedores','bdb-ferramentas','{"nome":"BDB Ferramentas","faixa":"C","compras2026":173227,"categoria":"","obs":"","distribuidor":false,"ativo":true}',null),
('fornecedores','fek','{"nome":"FEK","faixa":"C","compras2026":154224,"categoria":"","obs":"","distribuidor":false,"ativo":true}',null),
('fornecedores','delcaflex','{"nome":"Delcaflex","faixa":"C","compras2026":145983,"categoria":"","obs":"","distribuidor":false,"ativo":true}',null),
('fornecedores','steck','{"nome":"Steck","faixa":"C","compras2026":145820,"categoria":"","obs":"","distribuidor":false,"ativo":true}',null),
('fornecedores','hellermanntyton','{"nome":"HellermannTyton","faixa":"C","compras2026":145709,"categoria":"","obs":"","distribuidor":false,"ativo":true}',null),
('ciclos','2027-1','{"numero":1,"ano":2027,"inicio":"2027-01-01","fim":"2027-02-28","ancoras":[],"tema":""}',null),
('ciclos','2027-2','{"numero":2,"ano":2027,"inicio":"2027-03-01","fim":"2027-04-30","ancoras":[],"tema":""}',null),
('ciclos','2027-3','{"numero":3,"ano":2027,"inicio":"2027-05-01","fim":"2027-06-30","ancoras":[],"tema":""}',null),
('ciclos','2027-4','{"numero":4,"ano":2027,"inicio":"2027-07-01","fim":"2027-08-31","ancoras":[],"tema":""}',null),
('ciclos','2027-5','{"numero":5,"ano":2027,"inicio":"2027-09-01","fim":"2027-10-31","ancoras":[],"tema":""}',null),
('ciclos','2027-6','{"numero":6,"ano":2027,"inicio":"2027-11-01","fim":"2027-12-31","ancoras":[],"tema":""}',null)
on conflict (collection, id) do nothing;

-- ============================================================================
-- Aprovação de cadastros (/admin) sem service role key: o admin aprova/rejeita
-- usando a própria sessão. Só quem tem role = 'admin' passa por esta policy.
-- ============================================================================
drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin" on public.profiles
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
