import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

// E-mail do administrador que aprova novos cadastros — precisa bater com o
// e-mail hardcoded no trigger handle_new_user() em supabase/schema.sql.
const ADMIN_EMAIL = "marketing2@contattos.com";

// Chamada pela página de signup depois de um supabase.auth.signUp() bem-sucedido.
// Best-effort: qualquer falha aqui não deve impedir o cadastro, então sempre
// respondemos ok, mesmo quando o e-mail não é enviado.
export async function POST(request) {
  let email;
  try {
    ({ email } = await request.json());
  } catch {
    return NextResponse.json({ ok: true });
  }
  if (!email) return NextResponse.json({ ok: true });

  try {
    const supabase = getSupabaseServerClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("status")
      .eq("email", email)
      .eq("status", "pending")
      .maybeSingle();

    if (!profile) return NextResponse.json({ ok: true });

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("RESEND_API_KEY não configurada — e-mail de aviso de novo cadastro não enviado.");
      return NextResponse.json({ ok: true });
    }

    const origin = request.headers.get("origin") || new URL(request.url).origin;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || "Marketing OS <onboarding@resend.dev>",
        to: [ADMIN_EMAIL],
        subject: "Novo cadastro pendente — Marketing OS",
        html: `<p>O e-mail <strong>${email}</strong> solicitou acesso ao Marketing OS.</p><p><a href="${origin}/admin">Abrir painel de aprovação</a></p>`,
      }),
    });

    if (!res.ok) {
      console.error("Resend retornou erro ao enviar aviso de cadastro:", await res.text());
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Erro ao enviar e-mail de aviso de cadastro", e);
    return NextResponse.json({ ok: true });
  }
}
