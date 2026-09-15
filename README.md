# Marketing OS — Contattos+

Port do componente React `marketing_os.jsx` (feito originalmente para o ambiente de
artifacts do Claude.ai) para uma aplicação Next.js real, com Postgres/Supabase no lugar
da API `window.storage` do sandbox.

Toda a lógica de negócio, os componentes visuais e os estilos (Tailwind + CSS-in-JS) do
componente original foram mantidos como estavam. O que mudou foi **apenas a camada de
persistência**:

| Original (artifact)                          | Agora                                                  |
| --------------------------------------------- | ------------------------------------------------------- |
| `window.storage.get/set(key, shared)`         | Rotas `/api/*` do Next.js, que leem/gravam no Postgres via Supabase |
| `fetch("https://api.anthropic.com/...")` direto no navegador (sem auth) | Rota de servidor `/api/ai/suggest-demand`, que guarda a `ANTHROPIC_API_KEY` |
| Nome do usuário salvo com `shared=false`      | `localStorage` (é uma preferência local ao navegador, não precisa ir para o banco) |
| Sem login — qualquer um com a URL acessava    | Login com e-mail/senha (Supabase Auth) + aprovação manual de novos cadastros |

## Stack

- **Next.js 14 (App Router)** — front-end (client component) + rotas de API no mesmo projeto
- **Supabase (Postgres + Auth)** — banco de dados e autenticação
- **@supabase/ssr** — sessão de login sincronizada entre navegador, Server Components e middleware
- **Resend** — envio do e-mail que avisa o admin sobre novos cadastros pendentes
- **Tailwind CSS** — as classes utilitárias (`flex`, `gap-2`, `rounded`, etc.) já usadas no componente original
- **lucide-react** — ícones, iguais aos do componente original

## Autenticação e aprovação de cadastros

Login com e-mail/senha. Todo cadastro novo nasce com status `pending` e não acessa o
app até um admin aprovar — nem mesmo o próprio Supabase Auth libera acesso automático,
o gate de aprovação é feito por este projeto, em cima da autenticação do Supabase.

Fluxo:

1. Alguém cria conta em `/signup` (e-mail + senha). O Supabase Auth manda um e-mail de
   confirmação (padrão do projeto); depois de confirmar, a pessoa já consegue **entrar**,
   mas fica travada na tela `/pending` até ser aprovada.
2. Ao criar a conta, a rota `/api/auth/notify-signup` dispara um e-mail (via Resend) para
   `marketing2@contattos.com` avisando do cadastro pendente, com um link para `/admin`.
3. O admin entra, vai em `/admin`, e aprova ou rejeita. A aprovação libera o acesso na
   hora (o `middleware.js` redireciona para o app assim que o `profile.status` virar
   `approved`).
4. `marketing2@contattos.com` é o e-mail "bootstrap": é aprovado e promovido a admin
   automaticamente no cadastro (hardcoded no trigger `handle_new_user()` em
   `supabase/schema.sql` — é o único jeito de existir um admin antes de qualquer aprovação
   manual). Para trocar/adicionar outro admin depois, edite a tabela `profiles`
   (`role = 'admin'`) direto no SQL Editor do Supabase.

Onde cada peça mora:

- `supabase/schema.sql` — tabela `profiles`, trigger `handle_new_user()` (cria o profile
  `pending`/`member` a cada signup, exceto o e-mail admin), helper `private.is_admin()` e
  as policies de RLS de `profiles`.
- `middleware.js` — redireciona: sem sessão → `/login`; sessão sem aprovação → `/pending`;
  `/admin` só para `role = 'admin'`; já aprovado tentando ir em `/login`/`/signup` → `/`.
- `src/lib/supabase/{client,server}.js` — clientes com a *publishable key* (respeitam RLS),
  usados só pelo fluxo de auth. Diferente de `src/lib/supabaseServer.js` (service role,
  ignora RLS), que continua sendo o único jeito de ler/gravar `projects`/`campaigns`/etc.
- `src/lib/supabase/authGuard.js` — `requireApprovedUser()`/`requireAdmin()`, chamados no
  topo de toda rota `/api/*` que expõe dados (as 6 entidades + a rota de IA) e das rotas de
  admin, para bloquear quem não está aprovado mesmo que descubra a URL da API direto.
- `/login`, `/signup`, `/pending`, `/admin` — páginas novas; o resto do app (`/`) é o
  `MarketingOS.jsx` original, só com um botão "Sair" adicionado na barra lateral.

## Estrutura do projeto

```
middleware.js                   # gate de páginas: login/aprovação/admin (ver seção de auth)
src/
  app/
    layout.jsx                 # layout raiz + import do Tailwind
    page.jsx                   # renderiza <MarketingOS />
    globals.css
    login/page.jsx             # e-mail + senha
    signup/page.jsx            # cria conta (fica pending) + dispara aviso ao admin
    pending/page.jsx           # "aguardando aprovação", com botão de sair
    admin/
      page.jsx                  # lista profiles (Server Component)
      ApprovalPanel.jsx          # botões Aprovar/Rejeitar (client component)
    api/
      projects/route.js        # GET (lista) / PUT (salva a lista inteira)
      campaigns/route.js
      demands/route.js
      suppliers/route.js
      events/route.js
      team/route.js             # tabela team_members
      ai/suggest-demand/route.js # proxy para a Anthropic API (chave só no servidor)
      admin/approve/route.js    # aprova cadastro (admin-only, service role)
      admin/reject/route.js     # rejeita cadastro (admin-only, service role)
      auth/notify-signup/route.js # envia o e-mail de aviso via Resend
  components/
    MarketingOS.jsx             # componente original, com a camada de storage trocada
  lib/
    supabaseServer.js           # cliente Supabase (service role, só no servidor)
    supabase/
      client.js                 # cliente para componentes "use client" (publishable key)
      server.js                 # cliente para Server Components/Route Handlers (cookies)
      authGuard.js               # requireApprovedUser() / requireAdmin()
    case-map.js                 # camelCase (JS) <-> snake_case (Postgres)
    entity-route.js             # fábrica de handlers GET/PUT reaproveitada pelas 6 rotas
    api-client.js                # substitui loadShared/saveShared/useAutoSave do artifact
supabase/
  schema.sql                    # DDL das 6 tabelas de dados + profiles/auth
  seed.sql                      # dados de exemplo equivalentes aos seedProjects()/etc. originais
```

## Modelagem do banco

Cada entidade principal (`projects`, `campaigns`, `demands`, `suppliers`, `events`,
`team_members`) é uma tabela própria. Os campos usados para filtro/ordenação no board
(status, prioridade, categoria, prazo) são colunas normais; listas aninhadas — checklist,
comentários, prospecção de fornecedores, transações financeiras, feedbacks, tags — ficam em
colunas `JSONB`, guardando exatamente o mesmo formato de objeto que o componente React já
manipula. Isso evitou reescrever a lógica de checklist/comentários/prospecção em tabelas
filhas separadas.

Os `id`s continuam sendo gerados no cliente pela função `uid()` do componente original
(strings, não UUID) — por isso as colunas `id` são `TEXT`, não `UUID`.

Veja `supabase/schema.sql` para o DDL completo e os comentários de cada decisão.

## Como a persistência funciona agora

O componente mantém as mesmas listas em memória (`projects`, `campaigns`, etc.) e o mesmo
`useAutoSave` debounced (300ms) do artifact original. A diferença é só o destino:

1. **Carregar**: `GET /api/<entidade>` retorna todos os registros da tabela.
2. **Salvar**: `PUT /api/<entidade>` recebe a lista inteira atual e faz, na mesma rota,
   um diff simples — apaga do banco os registros que saíram da lista e faz `upsert` dos que
   continuam ou foram criados. Isso preserva o comportamento "salva a lista inteira" do
   artifact original sem precisar reescrever cada ação (adicionar item de checklist, mover
   card, etc.) como uma chamada de API separada.

Se a tabela ainda não tiver nenhum dado (ex.: banco recém-criado, sem rodar `seed.sql`), o
`GET` retorna uma lista vazia normalmente — o app não fica vazio "de propósito" nesse caso, é
o estado real do banco. Os dados de exemplo (`seedProjects()`, `seedCampaigns()`, etc.) só
são usados no front-end como **fallback de rede/erro** (ex.: Supabase fora do ar), igual ao
`catch` do `loadShared` original.

## Configuração

1. Crie um projeto em [supabase.com](https://supabase.com) (ou use um já existente).
2. Rode `supabase/schema.sql` no SQL Editor do projeto — cria as 6 tabelas de dados, a
   tabela `profiles` e o trigger que aprova automaticamente `marketing2@contattos.com`
   como admin. **Se quiser usar outro e-mail como admin**, troque esse e-mail no arquivo
   antes de rodar (procure por `marketing2@contattos.com` em `handle_new_user()`).
3. Opcional: rode `supabase/seed.sql` para começar com os mesmos exemplos do artifact original.
4. Crie uma conta gratuita em [resend.com](https://resend.com) e gere uma API key —
   é o serviço que envia o e-mail avisando o admin de novos cadastros.
5. Copie `.env.example` para `.env.local` e preencha:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...   # Project Settings → API Keys

   SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=...   # Project Settings → API → service_role (NUNCA a anon key)

   ANTHROPIC_API_KEY=sk-ant-...
   ANTHROPIC_MODEL=claude-sonnet-4-5-20250929

   RESEND_API_KEY=re_...
   RESEND_FROM_EMAIL=Marketing OS <onboarding@resend.dev>
   ```

   A `service_role key` e a `ANTHROPIC_API_KEY`/`RESEND_API_KEY` só são usadas nas rotas
   `/api/*` (servidor) e nunca são expostas ao navegador. As duas `NEXT_PUBLIC_*` são
   client-safe (o Supabase as chama de "publishable key", equivalente à antiga `anon key`)
   — é assim que o navegador faz login e lê o próprio `profile`, sempre limitado pelas
   policies de RLS.

6. Instale as dependências e rode em desenvolvimento:

   ```bash
   npm install
   npm run dev
   ```

7. Acesse `http://localhost:3000`, clique em "Solicitar cadastro" e cadastre-se com
   `marketing2@contattos.com` primeiro — é o e-mail que se torna admin automaticamente e
   consegue aprovar todo o resto pelo painel em `/admin`.

**Nota sobre o remetente do Resend**: sem verificar um domínio próprio no Resend, o
endereço de sandbox `onboarding@resend.dev` só entrega e-mails para o endereço cadastrado
na sua própria conta Resend. Se o aviso não chegar, veja os logs da rota
`/api/auth/notify-signup` (ou o dashboard do Resend) — o cadastro em si não é afetado,
só o e-mail de aviso.

## Build de produção

```bash
npm run build
npm start
```

## Deploy na Vercel

O projeto é um Next.js padrão (App Router), então a Vercel detecta o framework
automaticamente e não precisa de `vercel.json`. Só é preciso configurar duas coisas no
painel do projeto antes do primeiro deploy:

1. **Node.js Version**: em Project Settings → General → Node.js Version, selecione
   **22.x**. O `@supabase/supabase-js` resolvido (`package-lock.json`) exige Node ≥ 22;
   isso também está declarado em `package.json` (`engines.node`), mas a Vercel só aplica a
   versão que estiver selecionada nessa configuração do projeto.
2. **Environment Variables**: em Project Settings → Environment Variables, adicione (em
   Production e, se for usar Preview deployments, também em Preview):

   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
   SUPABASE_URL
   SUPABASE_SERVICE_ROLE_KEY
   ANTHROPIC_API_KEY
   ANTHROPIC_MODEL   (opcional — default: claude-sonnet-4-5-20250929)
   RESEND_API_KEY
   RESEND_FROM_EMAIL   (opcional — default: onboarding@resend.dev)
   ```

   As duas `NEXT_PUBLIC_*` viram parte do bundle do navegador (login, middleware) — são a
   publishable key, seguras para isso. As demais só existem no servidor.

Depois disso, qualquer `git push` para o branch conectado ao projeto na Vercel já faz o
deploy. Sem `SUPABASE_SERVICE_ROLE_KEY`/`ANTHROPIC_API_KEY`/`RESEND_API_KEY` configuradas, o
build/deploy continua funcionando normalmente (as rotas `/api/*` são forçadas a rodar em
runtime, nunca em build time) — mas sem as `NEXT_PUBLIC_*` corretas o login não funciona,
já que o middleware precisa delas para toda navegação de página.

## Sorteio (cadastro de participantes)

Duas páginas novas, fora do fluxo de login do Marketing OS:

- **`/sorteio`** — pública, sem necessidade de login. O cliente preenche nome,
  celular, CPF, e-mail, número da nota fiscal e data da compra. A rota
  `POST /api/sorteio` valida os dados (CPF validado pelo algoritmo oficial dos
  dígitos verificadores, em `src/lib/cpf.js`), grava o registro em
  `raffle_entries` com um número da sorte aleatório de 6 dígitos (gerando outro
  em caso de colisão, já que a coluna é `unique`) e devolve esse número na
  hora — é o que aparece na tela para o cliente guardar.
- **`/admin/sorteio`** — só para admin (mesma regra de `/admin` no
  `middleware.js`). Lista todos os participantes (nome, celular, CPF, e-mail,
  nota fiscal, data da compra, número sorteado e data do cadastro), com busca e
  exportação para CSV. Tem um link a partir de `/admin`.

Como as outras tabelas de dados, `raffle_entries` tem RLS habilitado sem
nenhuma policy — só é lida/gravada pela `SUPABASE_SERVICE_ROLE_KEY`, usada
pela rota `/api/sorteio` (que faz sua própria validação de admin no `GET` via
`requireAdmin()`, já que a página pública de cadastro é o único jeito de
`POST` sem estar logado). Veja a seção "SORTEIO" em `supabase/schema.sql`
para o DDL.

## O que ficou fora do escopo (de propósito)

- **Reset de senha / "esqueci minha senha"**: o Supabase Auth já suporta isso
  (`resetPasswordForEmail`), só não montei a tela — é um próximo passo natural, sem
  precisar mudar nada na modelagem de `profiles`.
- **Múltiplos admins com convite**: hoje só existe um admin "bootstrap"
  (`marketing2@contattos.com`, hardcoded no trigger). Promover outra pessoa a admin é uma
  linha de SQL (`update profiles set role = 'admin' where email = '...'`), mas não fiz uma
  tela para isso — a superfície de quem pode virar admin fica menor assim.
- **Multiusuário em tempo real**: como no original, cada aba salva a lista inteira da
  entidade a cada mudança (debounced). Para colaboração simultânea entre várias pessoas
  editando ao mesmo tempo, o ideal seria migrar para operações por item (CRUD granular) ou
  usar o Supabase Realtime — isso mudaria a lógica interna do componente, então preferi não
  fazer essa mudança sem alinhar antes.
