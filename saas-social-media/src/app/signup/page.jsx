"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import AuthCard from "@/components/AuthCard";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { data, error: err } = await createClient().auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/onboarding`,
      },
    });
    setLoading(false);
    if (err) return setError(err.message);
    // Com confirmação de e-mail desativada no Supabase já vem sessão
    if (data.session) {
      router.push("/onboarding");
      router.refresh();
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <AuthCard title="Confira seu e-mail" subtitle={`Enviamos um link de confirmação para ${email}. Depois de confirmar, é só entrar.`}>
        <Link href="/login" className="btn-primary w-full">Ir para o login</Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Criar conta" subtitle="Organize clientes, aprovações e agendamentos em um só lugar.">
      <form onSubmit={handleSubmit}>
        {error && <div className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
        <label className="label">Seu nome</label>
        <input className="input mb-4" required value={name} onChange={(e) => setName(e.target.value)} />
        <label className="label">E-mail</label>
        <input className="input mb-4" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <label className="label">Senha</label>
        <input className="input mb-6" type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="btn-primary w-full" disabled={loading}>{loading ? "Criando…" : "Criar conta"}</button>
        <p className="mt-4 text-center text-sm text-ink-soft">
          Já tem conta? <Link href="/login" className="font-semibold text-brand">Entrar</Link>
        </p>
      </form>
    </AuthCard>
  );
}
