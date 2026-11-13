"use client";

import { useWorkspace } from "./WorkspaceProvider";

export default function ClientFilter({ value, onChange }) {
  const { clients } = useWorkspace();
  return (
    <select className="input w-auto py-1.5" value={value} onChange={(e) => onChange(e.target.value)} aria-label="Filtrar por cliente">
      <option value="">Todos os clientes</option>
      {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
    </select>
  );
}
