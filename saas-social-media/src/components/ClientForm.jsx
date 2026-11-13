"use client";

import { useState } from "react";
import { useWorkspace } from "./WorkspaceProvider";

const COLORS = ["#6D4AFF", "#F25C54", "#F7A928", "#2BB673", "#1E90FF", "#E84393", "#16151D", "#00B8A9"];

export default function ClientForm({ initial = {}, onDone }) {
  const { saveClient } = useWorkspace();
  const [client, setClient] = useState({ name: "", instagram_handle: "", color: COLORS[0], notes: "", ...initial });
  const [saving, setSaving] = useState(false);
  const set = (patch) => setClient((c) => ({ ...c, ...patch }));

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    const saved = await saveClient(client);
    setSaving(false);
    if (saved) onDone?.(saved);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label">Nome do cliente</label>
        <input className="input" required value={client.name} onChange={(e) => set({ name: e.target.value })} />
      </div>
      <div>
        <label className="label">@ do Instagram</label>
        <input className="input" placeholder="@cliente" value={client.instagram_handle || ""} onChange={(e) => set({ instagram_handle: e.target.value })} />
      </div>
      <div>
        <label className="label">Cor</label>
        <div className="flex gap-2">
          {COLORS.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => set({ color: c })}
              className={`h-7 w-7 rounded-full ring-offset-2 ${client.color === c ? "ring-2 ring-ink" : ""}`}
              style={{ background: c }}
              aria-label={`Cor ${c}`}
            />
          ))}
        </div>
      </div>
      <div>
        <label className="label">Observações (tom de voz, público, restrições…)</label>
        <textarea className="input min-h-[80px]" value={client.notes || ""} onChange={(e) => set({ notes: e.target.value })} />
      </div>
      <div className="flex justify-end gap-2">
        {onDone && <button type="button" onClick={() => onDone(null)} className="btn-ghost">Cancelar</button>}
        <button className="btn-primary" disabled={saving}>{saving ? "Salvando…" : "Salvar"}</button>
      </div>
    </form>
  );
}
