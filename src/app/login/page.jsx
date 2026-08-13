"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

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
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-xl border border-[#DDE0E6] bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[#0038FF]">
            <span className="font-bold text-white">M</span>
          </div>
          <h1 className="text-lg font-bold text-[#0A0E1A]">Entrar no Marketing OS</h1>
          <p className="text-sm text-[#8A8DA0]">Contattos+</p>
        </div>

        {error && <div className="mb-4 rounded-md bg-[#FBDEE1] px-3 py-2 text-sm text-[#E23744]">{error}</div>}

        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#8A8DA0]">E-mail</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded-md border border-[#DDE0E6] px-3 py-2 text-sm outline-none focus:border-[#0038FF]"
        />

        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#8A8DA0]">Senha</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-6 w-full rounded-md border border-[#DDE0E6] px-3 py-2 text-sm outline-none focus:border-[#0038FF]"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-[#0038FF] py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>

        <p className="mt-4 text-center text-sm text-[#4A4E5C]">
          Não tem conta?{" "}
          <Link href="/signup" className="font-semibold text-[#0038FF]">
            Solicitar cadastro
          </Link>
        </p>
      </form>
    </div>
  );
}
