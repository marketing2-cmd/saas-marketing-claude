# space mais — Contattos+

Sistema interno de gestão da Contattos+: **rotina + projetos + atas + integração entre
setores + chat** num lugar só. Inspirado no ClickUp (quadro), Asana (painel da tarefa),
monday (lista com células coloridas) e Notion (atas como páginas) — mas com poucos
conceitos, para facilitar a adoção pela equipe.

| Onde | O que tem |
| --- | --- |
| **Início** | Saudação, tarefas do dia (atrasadas/hoje/próximas), rotina de hoje, pedidos recebidos pelo seu setor e pedidos que vocês fizeram. Botões: *Nova tarefa*, *Pedir a outro setor*, *Nova ata*. |
| **Setores** | Marketing, Comercial, Financeiro, Operações, Pessoas/RH (editáveis no banco). Cada setor tem abas Projetos, Tarefas, Pedidos, Rotinas e Atas. |
| **Projeto** | Visões **Lista** (agrupada por status) e **Quadro** (kanban com arrastar-e-soltar). Filtro "Só as minhas". |
| **Tarefa** | Painel lateral: responsável, prazo, status, prioridade, setor, projeto, descrição, checklist e comentários. |
| **Pedir a outro setor** | Cria uma tarefa no setor de destino marcada com o setor que pediu. Aparece no Início de quem é do setor e na aba Pedidos (recebidos/enviados). |
| **Rotinas** | Atividades recorrentes (diária em dias úteis, semanal, mensal) com check por período e registro de quem fez e quando. |
| **Atas** | Página por reunião: data, setor, participantes, pauta, decisões e **encaminhamentos — cada um vira tarefa**. |
| **Chat** | Canais (#geral + um por setor) em tempo real, com ponte para espaços do **Google Chat**. |

O **Marketing OS** (sistema anterior, descrito mais abaixo) continua disponível em
`/marketing-os`, com link no rodapé do menu lateral.

## space mais — configuração

1. Rode `supabase/schema.sql` (se ainda não rodou) e depois **`supabase/space.sql`** no
   SQL Editor do Supabase. Ele cria as tabelas `sm_*`, as policies de RLS (usuários
   aprovados leem e escrevem tudo; o webhook do Google Chat só o servidor lê), liga o
   Realtime e cadastra os setores e canais iniciais.
2. Variáveis de ambiente: as mesmas do Marketing OS (seção *Configuração* abaixo) +
   `GOOGLE_CHAT_AUDIENCE` se for receber mensagens do Google Chat.
3. No primeiro acesso, cada pessoa informa nome e setor (dá para mudar depois clicando no
   próprio nome, no rodapé do menu).

**Modo demonstração** — para treinar a equipe ou testar sem banco:

```bash
NEXT_PUBLIC_SPACE_DEMO=1 npm run dev
```

Desliga o login e guarda tudo no `localStorage` do navegador, com dados de exemplo.
Nunca ative em produção.

### Como os dados funcionam

- O navegador lê/grava direto nas tabelas `sm_*` com a *publishable key*; o RLS
  (`private.is_approved()`) garante que só usuários aprovados acessam.
- Toda alteração aparece para os outros na hora via **Supabase Realtime**.
- Enviar mensagem no chat passa por `POST /api/space/chat/send` (servidor), que grava e
  repassa ao Google Chat quando o canal estiver conectado.
- Código: `src/components/space/*` (telas), `src/lib/space/data.js` (Supabase × demo),
  `src/lib/space/model.js` (status, prioridades, regras de rotina e datas).

### Conectar o chat ao Google Chat

A ponte é configurada **por canal**, por um admin, no botão *Google Chat* no topo do canal.

**Enviar do space mais → Google Chat (webhook, 2 minutos):**
1. No espaço do Google Chat: nome do espaço → *Apps e integrações* → *Webhooks* →
   *Adicionar webhook*. Copie a URL.
2. No space mais, em Chat → canal → *Google Chat*, cole a URL e um nome de exibição.
   Pronto: cada mensagem enviada no canal também aparece no espaço como
   `*Nome* (space+): mensagem`.

**Receber do Google Chat → space mais (Chat app):**
1. No Google Cloud Console (projeto da Contattos+), ative a **Google Chat API** e, em
   *Configuração*, crie o app: nome *space mais*, "Funcionalidade: participar de espaços e
   conversas em grupo", *Configuração de conexão* = **URL do endpoint HTTP**:
   `https://SEU-DOMINIO/api/space/google-chat/events`.
2. Em *Authentication audience*, escolha **Project number** e coloque esse número em
   `GOOGLE_CHAT_AUDIENCE` (ou escolha *HTTP endpoint URL* e coloque a URL). A rota verifica
   o JWT assinado pelo Google em toda chamada — sem isso ela responde 401.
3. Adicione o app ao espaço. Ele responde com o ID do espaço (`spaces/AAAA…`, também visível
   na URL do Google Chat depois de `/room/`). Cole esse ID no campo *ID do espaço* do canal.
4. Mensagens que **mencionarem @space mais** no espaço aparecem no canal com o selo
   "via Google Chat" (é uma limitação do Google: apps só recebem mensagens em que são
   mencionados ou DMs). Se o e-mail do remetente for de alguém cadastrado, o avatar é ligado à pessoa.

---

# Marketing OS — Contattos+ (disponível em `/marketing-os`)

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
    page.jsx                   # renderiza o space mais (<SpaceApp />)
    marketing-os/page.jsx      # renderiza <MarketingOS />
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
