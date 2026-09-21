# Sorteio 18 Anos — Contattos+ (Firebase)

Site standalone (fora do Next.js/Supabase do resto do repositório) para a promoção
"Sorteio 18 Anos Contattos+": uma landing page pública onde o cliente final se
cadastra informando os dados da compra e recebe seus números da sorte, e um
painel `/admin` para a equipe ver quem se cadastrou.

Feito com **Vite + React** no front-end e **Firebase** (Firestore + Auth +
Hosting) como backend — projeto e credenciais totalmente separados do
Supabase usado no resto do sistema. Roda inteiro no plano gratuito **Spark**
(sem cartão de crédito): não usa Cloud Functions nem Cloud Storage, que hoje
em dia exige o plano pago Blaze mesmo dentro da cota gratuita.

## Como funciona

- **`/` (público)** — landing page com contagem regressiva, regras da
  promoção, prêmio e o formulário de cadastro (nome, celular, CPF, e-mail,
  valor da compra e foto da nota fiscal). Ao enviar, o site:
  1. Comprime a foto da nota fiscal **no navegador** (redimensiona +
     recodifica em JPEG leve, veja `src/lib/image.js`) e a guarda como
     base64 dentro do próprio cadastro — sem precisar do Cloud Storage.
  2. Usa uma **transação no Firestore** (`counters/sorteio`) para reservar um
     bloco de números sequenciais e únicos — 1 número a cada R$ 250,00 — sem
     precisar de um servidor próprio.
  3. Grava o cadastro na coleção `inscricoes` do **Firestore**, com
     `status: "pendente"`.
- **`/admin` (privado)** — login com e-mail/senha (**Firebase
  Authentication**). Só usuários cadastrados manualmente na coleção `admins`
  conseguem listar os cadastros (a regra de segurança bloqueia qualquer
  outro usuário, autenticado ou não). O painel mostra todos os cadastros em
  tempo real, permite buscar/filtrar, ver a foto da nota fiscal em tamanho
  grande, aprovar ou desclassificar cada cadastro, exportar tudo em CSV e
  sortear um número vencedor entre os cadastros não desclassificados.

Como só o Firestore protege os dados (não há servidor próprio), a regra em
`firestore.rules` é a parte mais importante deste projeto: qualquer
visitante pode **criar** seu próprio cadastro (com validação de formato e
tamanho de cada campo, incluído o limite de tamanho da foto), mas só um
admin autenticado pode **ler, listar ou alterar** os cadastros de outras
pessoas.

## Configurando o projeto Firebase

1. Crie um projeto em [console.firebase.google.com](https://console.firebase.google.com)
   (plano gratuito **Spark**).
2. Em **Build > Authentication**, clique em "Vamos começar" e ative o
   provedor **E-mail/senha** em Sign-in method.
3. Em **Build > Authentication > Users**, crie o(s) usuário(s) que vão
   administrar o sorteio (ex.: `marketing2@contattos.com` + uma senha).
4. Em **Build > Firestore Database**, crie o banco (modo produção, região
   `southamerica-east1` para ficar perto do Brasil).
5. Dentro do Firestore, crie manualmente:
   - Um documento em `admins/{uid}` para cada usuário administrador — o
     `uid` é o ID do usuário criado no passo 3 (Authentication > Users
     mostra o UID de cada um). O conteúdo do documento não importa, só a
     existência dele.
   - Um documento único `counters/sorteio` com o campo
     `lastNumber` (tipo número) = `1000`. É a partir dele que os números da
     sorte são gerados (1001, 1002, ...).
6. Em **Configurações do projeto > Geral > Seus apps**, crie um app da Web
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
firebase deploy --only firestore:rules,hosting
```

Ou simplesmente `npm run deploy` (já builda e publica no Hosting).

## Estrutura

```
firebase.json          # config do Hosting/Firestore para o Firebase CLI
firestore.rules         # segurança do Firestore (quem pode criar/ler cada coleção)
public/assets/            # imagens do sorteio (badge, prêmio, parceiros)
src/
  firebase.js              # inicializa o app Firebase a partir das env vars
  App.jsx                  # rotas: "/" (Sorteio) e "/admin" (Admin)
  pages/
    Sorteio.jsx              # landing page pública + formulário de cadastro
    Admin.jsx                # login + painel de cadastros
  lib/
    inscricoes.js            # alocação de números + grava o cadastro no Firestore
    image.js                 # compressão da foto da nota fiscal para base64
    format.js                # máscaras de celular/CPF e formatação de moeda/data
```

## Ajustando para outra promoção

Datas, valores e textos ficam concentrados em `src/pages/Sorteio.jsx`
(`DATA_SORTEIO`, `VALOR_MINIMO`) e no regulamento resumido no fim do
arquivo. O nome da coleção (`inscricoes`) e o valor por número
(`VALOR_POR_NUMERO` em `src/lib/inscricoes.js`) também podem ser alterados
ali — só lembre de atualizar a mesma regra em `firestore.rules`
(`numeros.size() == int(request.resource.data.valor / 250)`).

Se no futuro o projeto migrar para o plano Blaze e você preferir guardar as
fotos no Cloud Storage (qualidade original, sem compressão), volte a usar
`uploadBytes`/`getDownloadURL` em `src/lib/inscricoes.js` como antes.
