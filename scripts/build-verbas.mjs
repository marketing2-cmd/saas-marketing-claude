// Gera public/verbas.html a partir do artefato artifacts/verbas/verbas.html.
//
//   node scripts/build-verbas.mjs
//
// O artefato é a fonte única da interface. Este script:
//   1. envolve a página no esqueleto HTML completo (no Claude, quem faz isso é o publicador);
//   2. injeta scripts/verbas-shim.js, que implementa window.claude.use("db"/"user")
//      sobre a rota /api/verbas (Supabase);
//   3. troca os textos que falam de "artefato" e "conta do Claude" pelos do app.
// O arquivo gerado é versionado, então o deploy no Vercel não precisa rodar este script.
import { readFileSync, writeFileSync } from "node:fs";

const root = new URL("..", import.meta.url);
let page = readFileSync(new URL("artifacts/verbas/verbas.html", root), "utf8");
const shim = readFileSync(new URL("scripts/verbas-shim.js", root), "utf8");

const swaps = [
  [
    "Para a pessoa abrir o sistema, compartilhe o link do artefato com ela: <b>Colaborador</b> para Compras e Financeiro; <b>Leitor</b> para a Diretoria (só visualiza).",
    "Para entrar, a pessoa cria a conta no Marketing OS e você aprova em <a href=\"/admin\">Administração</a>. Depois, defina a área dela aqui. A área <b>Diretoria</b> só visualiza.",
  ],
  [
    "Ninguém encontrado. A pessoa precisa ter conta do Claude na organização.",
    "Ninguém encontrado. A pessoa precisa criar a conta e ser aprovada em Administração.",
  ],
  [
    "\" Para alterar fornecedores e ciclos, a pessoa precisa ser Editora do artefato.\"",
    "\" Só administradores alteram fornecedores e ciclos.\"",
  ],
  [
    "Abra este sistema pelo link do Claude, com sua conta da empresa, para ver e editar as verbas.",
    "Não foi possível conectar ao banco de dados. Recarregue a página.",
  ],
  [
    "join(\"\")}</nav>",
    "join(\"\")}<div class=\"cap\">Apps</div><a href=\"/\">${ico(\"painel\")}<span>Marketing OS</span></a></nav>",
  ],
];
for (const [from, to] of swaps) {
  const n = page.split(from).length - 1;
  if (n !== 1) throw new Error(`Esperava 1 ocorrência de: ${from.slice(0, 70)}… (achei ${n})`);
  page = page.replace(from, to);
}

const marker = '<script>\n"use strict";';
if (!page.includes(marker)) throw new Error("Não achei o script principal da página.");
page = page.replace(marker, `<script>\n${shim}\n</script>\n${marker}`);

const out = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex">
<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>
</head>
<body>
${page}
</body>
</html>
`;
writeFileSync(new URL("public/verbas.html", root), out);
console.log(`public/verbas.html gerado (${(out.length / 1024).toFixed(0)} KB)`);
