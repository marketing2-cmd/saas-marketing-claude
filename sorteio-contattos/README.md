# Sorteio 18 Anos — Contattos+ (Firebase)

Site standalone (fora do Next.js/Supabase do resto do repositório) para a promoção
"Sorteio 18 Anos Contattos+": uma landing page pública onde o cliente final se
cadastra informando os dados da compra e recebe seus números da sorte, e um
painel `/admin` para a equipe ver quem se cadastrou.

Feito com **Vite + React** no front-end e **Firebase** (Firestore + Auth +
Storage + Hosting) como backend — projeto e credenciais totalmente separados
do Supabase usado no resto do sistema.

## Como funciona

- **`/` (público)** — landing page com contagem regressiva, regras da
  promoção, prêmio e o formulário de cadastro (nome, celular, CPF, e-mail,
  valor da compra e foto da nota fiscal). Ao enviar, o site:
  1. Envia a foto da nota fiscal para o **Firebase Storage**
     (`notas-fiscais/...`).
  2. Usa uma **transação no Firestore** (`counters/sorteio`) para reservar um
     bloco de números sequenciais e únicos — 1 número a cada R$ 250,00 — sem
     precisar de um servidor próprio.
  3. Grava o cadastro na coleção `inscricoes` do **Firestore**, com
     `status: "pendente"`.
- **`/admin` (privado)** — login com e-mail/senha (**Firebase
  Authentication**). Só usuários cadastrados manualmente na coleção `admins`
  conseguem listar os cadastros (a regra de segurança bloqueia qualquer
  outro usuário, autenticado ou não). O painel mostra todos os cadastros em
  tempo real, permite buscar/filtrar, aprovar ou desclassificar cada
  cadastro (para confrontar com a nota fiscal), exportar tudo em CSV e
  sortear um número vencedor entre os cadastros não desclassificados.

Como só o Firestore/Storage protegem os dados (não há servidor próprio), as
regras em `firestore.rules` e `storage.rules` são a parte mais importante
deste projeto: qualquer visitante pode **criar** seu próprio cadastro, mas
só um admin autenticado pode **ler, listar ou alterar** os cadastros de
outras pessoas.

## Configurando o projeto Firebase

1. Crie um projeto em [console.firebase.google.com](https://console.firebase.google.com)
   (o plano gratuito **Spark** é suficiente — este projeto não usa Cloud
   Functions).
2. Em **Build > Authentication > Sign-in method**, ative o provedor
   **E-mail/senha**.
3. Em **Build > Authentication > Users**, crie o(s) usuário(s) que vão
   administrar o sorteio (ex.: `marketing2@contattos.com` + uma senha).
4. Em **Build > Firestore Database**, crie o banco (modo produção, região
   `southamerica-east1` para ficar perto do Brasil).
5. Em **Build > Storage**, ative o Storage (mesma região).
6. Dentro do Firestore, crie manualmente:
   - Um documento em `admins/{uid}` para cada usuário administrador — o
     `uid` é o ID do usuário criado no passo 3 (Authentication > Users
     mostra o UID de cada um). O conteúdo do documento não importa, só a
     existência dele.
   - Um documento único `counters/sorteio` com o campo
     `lastNumber` (tipo número) = `1000`. É a partir dele que os números da
     sorte são gerados (1001, 1002, ...).
7. Em **Configurações do projeto > Geral > Seus apps**, crie um app da Web
   (ícone `</>`) e copie as chaves do `firebaseConfig` para o seu `.env`
   (veja abaixo).

## Rodando localmente

```bash
cd sorteio-contattos
cp .env.example .env        # preencha com as chaves do seu projeto Firebase
npm install
npm run dev
```

- Site público: http://localhost:5173/
- Painel admin: http://localhost:5173/admin

## Publicando (Firebase Hosting)

```bash
npm install -g firebase-tools   # se ainda não tiver
firebase login
cd sorteio-contattos
cp .firebaserc.example .firebaserc   # troque pelo ID real do seu projeto
firebase deploy --only firestore:rules,storage:rules,hosting
```

Ou simplesmente `npm run deploy` (já builda e publica no Hosting).

## Estrutura

```
firebase.json          # config do Hosting/Firestore/Storage para o Firebase CLI
firestore.rules         # segurança do Firestore (quem pode criar/ler cada coleção)
storage.rules            # segurança do Storage (upload/leitura das notas fiscais)
public/assets/            # imagens do sorteio (badge, prêmio, parceiros)
src/
  firebase.js              # inicializa o app Firebase a partir das env vars
  App.jsx                  # rotas: "/" (Sorteio) e "/admin" (Admin)
  pages/
    Sorteio.jsx              # landing page pública + formulário de cadastro
    Admin.jsx                # login + painel de cadastros
  lib/
    inscricoes.js            # upload da nota fiscal + alocação de números + grava no Firestore
    format.js                # máscaras de celular/CPF e formatação de moeda/data
```

## Ajustando para outra promoção

Datas, valores e textos ficam concentrados em `src/pages/Sorteio.jsx`
(`DATA_SORTEIO`, `VALOR_MINIMO`) e no regulamento resumido no fim do
arquivo. O nome da coleção (`inscricoes`) e o valor por número
(`VALOR_POR_NUMERO` em `src/lib/inscricoes.js`) também podem ser alterados
ali — só lembre de atualizar a mesma regra em `firestore.rules`
(`numeros.size() == int(request.resource.data.valor / 250)`).
