"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import AuthCard from "@/components/AuthCard";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: err } = await createClient().auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message === "Invalid login credentials" ? "E-mail ou senha incorretos." : err.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <AuthCard title="Entrar" subtitle="Acesse o painel da sua agência.">
      <form onSubmit={handleSubmit}>
        {error && <div className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
        <label className="label">E-mail</label>
        <input className="input mb-4" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <label className="label">Senha</label>
        <input className="input mb-6" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="btn-primary w-full" disabled={loading}>{loading ? "Entrando…" : "Entrar"}</button>
        <p className="mt-4 text-center text-sm text-ink-soft">
          Ainda não tem conta? <Link href="/signup" className="font-semibold text-brand">Criar conta grátis</Link>
        </p>
      </form>
    </AuthCard>
  );
}
