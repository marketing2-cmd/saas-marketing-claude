import { NextResponse } from "next/server";

// Dá mais margem que o timeout padrão de função da Vercel para a chamada à Anthropic.
export const maxDuration = 30;

const SYSTEM_PROMPT = `Você atua como Diretor de Marketing virtual de uma rede de varejo de materiais elétricos, hidráulicos, ferramentas, iluminação e utilidades (Contattos+). Dada uma demanda recebida pelo departamento de marketing, classifique-a.
Responda APENAS com um JSON válido, sem markdown, sem texto fora do JSON, exatamente neste formato:
{"categoria":"Rotina|Projeto|Campanha|Urgente|Backlog|Delegável|Descartar","prioridade":"Baixa|Média|Alta|Urgente","responsavel":"nome exato de alguém da lista de equipe ou string vazia","prazoDias":0,"impacto":"Baixo|Médio|Alto","justificativa":"uma frase curta explicando a decisão"}
"prazoDias" é um número inteiro de dias a partir de hoje para o prazo sugerido. "responsavel" deve ser escolhido apenas dentre os nomes fornecidos, ou vazio se nenhum for claramente adequado.`;

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY não configurada no servidor." }, { status: 500 });
  }

  const { demand, teamNames } = await request.json();

  const userPrompt = `Título: ${demand?.title || "(sem título)"}
Descrição: ${demand?.description || "(sem descrição)"}
Canal de entrada: ${demand?.channel || "não informado"}
Solicitante: ${demand?.requester || "não informado"}
Equipe disponível: ${(teamNames || []).length ? teamNames.join(", ") : "(nenhuma cadastrada)"}
Data de hoje: ${new Date().toLocaleDateString("pt-BR")}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5-20250929",
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json({ error: `Erro da API da Anthropic: ${text}` }, { status: 502 });
    }

    const data = await response.json();
    const textBlock = (data.content || []).find((b) => b.type === "text");
    const raw = textBlock ? textBlock.text : "";
    const clean = raw.replace(/```json|```/g, "").trim();
    const suggestion = JSON.parse(clean);
    return NextResponse.json(suggestion);
  } catch (e) {
    return NextResponse.json({ error: "Não foi possível obter uma sugestão agora." }, { status: 500 });
  }
}
