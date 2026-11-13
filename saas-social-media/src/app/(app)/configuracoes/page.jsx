"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/components/WorkspaceProvider";

export default function SettingsPage() {
  const router = useRouter();
  const { workspace, supabase, notify, user, demo } = useWorkspace();
  const [name, setName] = useState(workspace.name);
  const [saving, setSaving] = useState(false);
  const isOwner = workspace.role === "owner";

  async function save(e) {
    e.preventDefault();
    if (demo) return notify("Na demonstração nada é salvo.");
    setSaving(true);
    const { error } = await supabase.from("workspaces").update({ name }).eq("id", workspace.id);
    setSaving(false);
    if (error) return notify(error.message, "error");
    notify("Salvo.");
    router.refresh();
  }

  return (
    <div className="max-w-xl">
      <h1 className="page-title">Configurações</h1>
      <form onSubmit={save} className="card mt-6 space-y-4 p-6">
        <div>
          <label className="label">Nome do espaço de trabalho</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} disabled={!isOwner} />
        </div>
        <div>
          <label className="label">Sua conta</label>
          <div className="text-sm text-ink-soft">{user.email} · {isOwner ? "Proprietário" : "Membro"}</div>
        </div>
        {isOwner && <button className="btn-primary" disabled={saving}>{saving ? "Salvando…" : "Salvar"}</button>}
      </form>
    </div>
  );
}
