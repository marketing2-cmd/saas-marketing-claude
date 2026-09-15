"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import ContattosLogo from "@/components/ContattosLogo";

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
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError(signInError.message === "Invalid login credentials" ? "E-mail ou senha incorretos." : signInError.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F6F3] px-4">
      <form className="w-full max-w-sm overflow-hidden rounded-xl border border-[#DDE0E6] bg-white shadow-sm" onSubmit={handleSubmit}>
        <div className="h-1.5 bg-gradient-to-r from-brand-amber via-brand-orange to-brand-red" />
        <div className="p-8">
          <div className="mb-6 text-center">
            <ContattosLogo size="md" className="mb-4 justify-center" />
            <h1 className="text-lg font-bold text-[#0A0E1A]">Entrar no Marketing OS</h1>
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
            className="mb-6 w-full rounded-md border border-[#DDE0E6] px-3 py-2 text-sm outline-none focus:border-brand-red"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-gradient-to-r from-brand-amber via-brand-orange to-brand-red py-2 text-sm font-bold text-white shadow-sm disabled:opacity-60"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>

          <p className="mt-4 text-center text-sm text-[#4A4E5C]">
            Não tem conta?{" "}
            <Link href="/signup" className="font-semibold text-brand-red">
              Solicitar cadastro
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
