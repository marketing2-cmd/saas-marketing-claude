"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AuthCard from "@/components/AuthCard";

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const { error: err } = await createClient().rpc("create_workspace", { ws_name: name.trim() });
    setLoading(false);
    if (err) return setError(err.message);
    router.push("/");
    router.refresh();
  }

  return (
    <AuthCard title="Bem-vindo(a)! 👋" subtitle="Como se chama sua agência ou seu trabalho de social media?">
      <form onSubmit={handleSubmit}>
        {error && <div className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
        <label className="label">Nome do espaço de trabalho</label>
        <input className="input mb-6" required placeholder="Ex.: Agência Aurora" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn-primary w-full" disabled={loading}>{loading ? "Criando…" : "Começar"}</button>
      </form>
    </AuthCard>
  );
}
