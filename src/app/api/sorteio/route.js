import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { requireAdmin } from "@/lib/supabase/authGuard";
import { isValidCPF, onlyDigits } from "@/lib/cpf";

export const dynamic = "force-dynamic";

function randomRaffleNumber() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Cadastro público (sem login) do cliente no sorteio. Gera um número da sorte
// aleatório e único (tenta de novo em caso de colisão com um já sorteado) e
// devolve na hora para exibir na tela.
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const name = String(body.name || "").trim();
  const phone = onlyDigits(body.phone);
  const cpf = onlyDigits(body.cpf);
  const email = String(body.email || "").trim().toLowerCase();
  const receiptNumber = String(body.receiptNumber || "").trim();
  const purchaseDate = String(body.purchaseDate || "").trim();

  if (!name) return NextResponse.json({ error: "Informe o nome completo." }, { status: 400 });
  if (phone.length < 10) return NextResponse.json({ error: "Informe um celular válido." }, { status: 400 });
  if (!isValidCPF(cpf)) return NextResponse.json({ error: "CPF inválido." }, { status: 400 });
  if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
  if (!receiptNumber) return NextResponse.json({ error: "Informe o número da nota fiscal." }, { status: 400 });
  if (!purchaseDate) return NextResponse.json({ error: "Informe a data da compra." }, { status: 400 });

  try {
    const supabase = getSupabaseServerClient();

    for (let attempt = 0; attempt < 5; attempt++) {
      const raffleNumber = randomRaffleNumber();
      const { data, error } = await supabase
        .from("raffle_entries")
        .insert({
          id: randomUUID(),
          name,
          phone,
          cpf,
          email,
          receipt_number: receiptNumber,
          purchase_date: purchaseDate,
          raffle_number: raffleNumber,
        })
        .select("raffle_number")
        .single();

      if (!error) return NextResponse.json({ raffleNumber: data.raffle_number });
      if (error.code !== "23505") return NextResponse.json({ error: error.message }, { status: 500 });
      // 23505 = número já sorteado por outra pessoa, tenta gerar outro.
    }

    return NextResponse.json({ error: "Não foi possível gerar seu número. Tente novamente." }, { status: 500 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// Lista de participantes, só para admin — usada pelo painel em /admin/sorteio.
export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("raffle_entries")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ items: data || [] });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
