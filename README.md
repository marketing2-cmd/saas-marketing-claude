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

## Stack

- **Next.js 14 (App Router)** — front-end (client component) + rotas de API no mesmo projeto
- **Supabase (Postgres)** — banco de dados, acessado só pelo servidor com a `service role key`
- **Tailwind CSS** — as classes utilitárias (`flex`, `gap-2`, `rounded`, etc.) já usadas no componente original
- **lucide-react** — ícones, iguais aos do componente original

## Estrutura do projeto

```
src/
  app/
    layout.jsx                 # layout raiz + import do Tailwind
    page.jsx                   # renderiza <MarketingOS />
    globals.css
    api/
      projects/route.js        # GET (lista) / PUT (salva a lista inteira)
      campaigns/route.js
      demands/route.js
      suppliers/route.js
      events/route.js
      team/route.js             # tabela team_members
      ai/suggest-demand/route.js # proxy para a Anthropic API (chave só no servidor)
  components/
    MarketingOS.jsx             # componente original, com a camada de storage trocada
  lib/
    supabaseServer.js           # cliente Supabase (service role, só no servidor)
    case-map.js                 # camelCase (JS) <-> snake_case (Postgres)
    entity-route.js             # fábrica de handlers GET/PUT reaproveitada pelas 6 rotas
    api-client.js                # substitui loadShared/saveShared/useAutoSave do artifact
supabase/
  schema.sql                    # DDL das 6 tabelas
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

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Rode `supabase/schema.sql` no SQL Editor do projeto (cria as 6 tabelas).
3. Opcional: rode `supabase/seed.sql` para começar com os mesmos exemplos do artifact original.
4. Copie `.env.example` para `.env.local` e preencha:

   ```
   SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=... # Project Settings → API → service_role (NUNCA a anon key)
   ANTHROPIC_API_KEY=sk-ant-...
   ANTHROPIC_MODEL=claude-sonnet-4-5-20250929
   ```

   A `service_role key` só é usada nas rotas `/api/*` (servidor) e nunca é exposta ao
   navegador — por isso as tabelas têm Row Level Security habilitado sem nenhuma policy: a
   chave anônima do Supabase não consegue ler nem escrever nelas, só o servidor consegue.

5. Instale as dependências e rode em desenvolvimento:

   ```bash
   npm install
   npm run dev
   ```

6. Acesse `http://localhost:3000`.

## Build de produção

```bash
npm run build
npm start
```

## O que ficou fora do escopo (de propósito)

- **Autenticação**: o artifact original não tinha login — qualquer pessoa com a URL usava o
  mesmo espaço de dados. Mantive esse comportamento (sem auth) para não mudar a experiência;
  adicionar autenticação do Supabase é o próximo passo natural se o app for exposto
  publicamente.
- **Multiusuário em tempo real**: como no original, cada aba salva a lista inteira da
  entidade a cada mudança (debounced). Para colaboração simultânea entre várias pessoas
  editando ao mesmo tempo, o ideal seria migrar para operações por item (CRUD granular) ou
  usar o Supabase Realtime — isso mudaria a lógica interna do componente, então preferi não
  fazer essa mudança sem alinhar antes.
