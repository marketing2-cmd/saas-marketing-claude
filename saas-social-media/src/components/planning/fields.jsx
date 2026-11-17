"use client";

import { Plus, Trash2 } from "lucide-react";

// Peças reutilizadas pelas seções de planejamento

export function SectionHeader({ title, description, action }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-bold">{title}</h2>
        {description && <p className="text-sm text-ink-soft">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function TextArea({ label, value, onChange, rows = 4, placeholder, hint }) {
  return (
    <div>
      <label className="label">{label}</label>
      <textarea className="input resize-y" rows={rows} value={value || ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      {hint && <p className="mt-1 text-[11px] text-ink-mute">{hint}</p>}
    </div>
  );
}

export function TextInput({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input" type={type} value={value || ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function AddButton({ onClick, children }) {
  return (
    <button onClick={onClick} className="btn-ghost px-3 py-2">
      <Plus size={16} /> {children}
    </button>
  );
}

export function RemoveButton({ onClick, label = "Remover" }) {
  return (
    <button onClick={onClick} className="btn px-2.5 py-2 text-rose-600 hover:bg-rose-50" aria-label={label}>
      <Trash2 size={16} />
    </button>
  );
}

export function EmptyAdd({ onClick, children }) {
  return (
    <button onClick={onClick} className="w-full rounded-2xl border-2 border-dashed border-line p-10 text-sm text-ink-mute transition hover:border-brand-ring hover:text-brand">
      {children}
    </button>
  );
}

// Lista de itens (personas, concorrentes, produtos) guardada num array do strategy
export function useListField(strategy, update, key) {
  const items = strategy[key] || [];
  return {
    items,
    add: (item) => update((s) => ({ [key]: [...(s[key] || []), item] })),
    set: (id, patch) => update((s) => ({ [key]: (s[key] || []).map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
    remove: (id) => update((s) => ({ [key]: (s[key] || []).filter((x) => x.id !== id) })),
  };
}
