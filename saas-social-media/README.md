# SaaS Social Media

Plataforma para social medias e agências: **clientes, calendário de conteúdo,
quadro de produção, aprovação pelo cliente via link e publicação automática no
Instagram** depois da aprovação.

Stack: Next.js 14 (App Router) · Supabase (Postgres, Auth, Storage) · Tailwind · Vercel.

## O que já funciona

| Área | Funcionalidade |
|---|---|
| Contas | Cadastro aberto (e-mail/senha). Cada conta cria um **espaço de trabalho** (agência); os dados ficam isolados por RLS. |
| Clientes | Cadastro com cor, @ do Instagram e observações. Cada cliente tem um **link secreto de aprovação**. |
| Posts | Editor com legenda (contador de 2.200), upload de imagens/vídeos, carrossel com reordenação, formato (feed, carrossel, reels, story), data/hora, tags, comentários internos e **prévia estilo Instagram**. |
| Calendário | Visão mensal e semanal, filtro por cliente, criar post clicando no dia, lista de posts sem data. |
| Quadro | Kanban por status com arrastar e soltar (Rascunho → Em aprovação → Ajuste pedido → Aprovado → Agendado → Publicado). |
| Feed | Grade 3 colunas mostrando como o perfil do cliente vai ficar. |
| Portal do cliente | `/c/<token>`, sem login: o cliente vê os posts, **aprova ou pede ajuste com comentário**, vê a prévia do feed e o histórico. |
| Agendamento | Ao aprovar um post com data, ele vira **Agendado**. O cron `/api/cron/publish` publica no horário via Instagram Graph API (imagem, carrossel, reels e story), com 3 tentativas e trava contra publicação duplicada. |
| Instagram | Conexão via login da Meta por cliente (`/api/meta/connect`). O token fica numa tabela que só o servidor lê. |

Ainda não feito (próximas etapas): Facebook e TikTok, convite de membros da
equipe, cobrança/planos (Stripe ou Asaas), notificações por e-mail/WhatsApp,
landing page de vendas.

## Como rodar

### 1. Supabase
1. Crie um projeto em [supabase.com](https://supabase.com).
2. No **SQL Editor**, rode `supabase/schema.sql` inteiro (cria tabelas, RLS e o bucket `media`).
3. Em **Authentication → URL Configuration**, coloque a URL do app em *Site URL* e
   `https://SEU-DOMINIO/onboarding` em *Redirect URLs*.
   (Para testes, você pode desligar *Confirm email* em Authentication → Providers → Email.)

### 2. Variáveis de ambiente
Copie `.env.example` para `.env.local` e preencha.

### 3. Local
```bash
npm install
npm run dev
```

### 4. Deploy na Vercel
- Importe o repositório e defina **Root Directory = `saas-social-media`**.
- Cadastre as variáveis do `.env.example` (com `NEXT_PUBLIC_APP_URL` = domínio de produção).
- O `vercel.json` agenda o cron a cada minuto. **Cron por minuto exige o plano Pro da
  Vercel**; no plano Hobby só roda 1x/dia. Alternativa gratuita: chamar a rota pelo
  Supabase (pg_cron + pg_net):
  ```sql
  select cron.schedule('publicar-posts', '* * * * *', $$
    select net.http_get(
      url := 'https://SEU-DOMINIO/api/cron/publish',
      headers := jsonb_build_object('Authorization', 'Bearer SEU_CRON_SECRET')
    );
  $$);
  ```

## Publicação no Instagram (Meta)

Requisitos da conta do cliente: Instagram **Profissional (Empresa ou Criador)**
vinculado a uma **Página do Facebook**.

1. Em [developers.facebook.com](https://developers.facebook.com) crie um app do tipo **Empresa**.
2. Adicione o produto **Login do Facebook para Empresas** e cadastre o redirect
   `https://SEU-DOMINIO/api/meta/callback`.
3. Copie *ID do app* e *Chave secreta* para `META_APP_ID` / `META_APP_SECRET`.
4. Em **Configurações básicas**, informe a URL da política de privacidade:
   `https://SEU-DOMINIO/privacidade` (revise o texto da página antes).
5. **Modo desenvolvimento:** já funciona para contas de quem tem papel no app
   (admin/desenvolvedor/testador) — dá para testar com as suas próprias contas.
6. **Para outros usuários:** envie o app para **Revisão do app** pedindo
   `instagram_basic`, `instagram_content_publish`, `pages_show_list`,
   `pages_read_engagement` e `business_management`, com vídeo mostrando o fluxo, e
   conclua a **Verificação da empresa**.

Limites da Meta: 50 publicações por conta a cada 24 h; mídia precisa ser JPEG
(imagem) ou MP4/MOV (vídeo) acessível por URL pública — por isso o bucket `media` é público.

## Estrutura

```
supabase/schema.sql              banco, RLS, storage
src/middleware.js                sessão + redireciona login/onboarding
src/app/(app)/                   painel (visão geral, calendário, quadro, clientes, configurações)
src/app/c/[token]/               portal público de aprovação do cliente
src/app/api/public/.../review    aprovar / pedir ajuste (portal)
src/app/api/meta/*               conectar/desconectar Instagram (OAuth)
src/app/api/cron/publish         publicador agendado
src/lib/meta.js                  chamadas à Instagram Graph API
src/components/                  editor de post, prévia, feed, provider de dados
```
