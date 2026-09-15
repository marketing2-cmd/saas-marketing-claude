"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import ContattosLogo from "@/components/ContattosLogo";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    if (password.length < 8) {
      setError("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/login` },
    });

    if (signUpError) {
      setLoading(false);
      setError(signUpError.message);
      return;
    }

    fetch("/api/auth/notify-signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => {});

    setLoading(false);
    setDone(true);
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F6F3] px-4">
        <div className="w-full max-w-sm overflow-hidden rounded-xl border border-[#DDE0E6] bg-white text-center shadow-sm">
          <div className="h-1.5 bg-gradient-to-r from-brand-amber via-brand-orange to-brand-red" />
          <div className="p-8">
            <ContattosLogo size="md" className="mb-4 justify-center" />
            <h1 className="mb-2 text-lg font-bold text-[#0A0E1A]">Cadastro enviado</h1>
            <p className="text-sm text-[#4A4E5C]">
              Confirme seu e-mail (enviamos um link de confirmação) e aguarde a aprovação do
              administrador. Você recebe acesso automaticamente assim que for aprovado.
            </p>
            <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-brand-red">
              Voltar para o login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F6F3] px-4">
      <form className="w-full max-w-sm overflow-hidden rounded-xl border border-[#DDE0E6] bg-white shadow-sm" onSubmit={handleSubmit}>
        <div className="h-1.5 bg-gradient-to-r from-brand-amber via-brand-orange to-brand-red" />
        <div className="p-8">
          <div className="mb-6 text-center">
            <ContattosLogo size="md" className="mb-4 justify-center" />
            <h1 className="text-lg font-bold text-[#0A0E1A]">Solicitar cadastro</h1>
          </div>

          {error && <div className="mb-4 rounded-md bg-[#FBDEE1] px-3 py-2 text-sm text-[#E23744]">{error}</div>}

          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#8A8DA0]">E-mail</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-4 w-full rounded-md border border-[#DDE0E6] px-3 py-2 text-sm outline-none focus:border-brand-red"
          />

          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#8A8DA0]">Senha</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-4 w-full rounded-md border border-[#DDE0E6] px-3 py-2 text-sm outline-none focus:border-brand-red"
          />

          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#8A8DA0]">Confirmar senha</label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mb-6 w-full rounded-md border border-[#DDE0E6] px-3 py-2 text-sm outline-none focus:border-brand-red"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-gradient-to-r from-brand-amber via-brand-orange to-brand-red py-2 text-sm font-bold text-white shadow-sm disabled:opacity-60"
          >
            {loading ? "Enviando…" : "Solicitar cadastro"}
          </button>

          <p className="mt-4 text-center text-sm text-[#4A4E5C]">
            Já tem conta?{" "}
            <Link href="/login" className="font-semibold text-brand-red">
              Entrar
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
