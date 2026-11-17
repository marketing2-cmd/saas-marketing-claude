"use client";

import { useState } from "react";
import { FileText, Paperclip, X } from "lucide-react";
import { useWorkspace } from "./WorkspaceProvider";
import CurrencyInput from "./CurrencyInput";
import { CONTRACT_STATUSES, NICHES, PAYMENT_METHODS, SERVICES } from "@/lib/clients";

const COLORS = ["#7C5CFC", "#F25C54", "#F7A928", "#2BB673", "#1E90FF", "#E84393", "#16151D", "#00B8A9"];

function Section({ title, children }) {
  return (
    <section className="space-y-4 rounded-2xl bg-paper/60 p-4 ring-1 ring-line">
      <h3 className="text-xs font-bold uppercase tracking-wider text-ink-mute">{title}</h3>
      {children}
    </section>
  );
}

export default function ClientForm({ initial = {}, onDone }) {
  const { saveClient, uploadContract } = useWorkspace();
  const [client, setClient] = useState({
    name: "",
    instagram_handle: "",
    color: COLORS[0],
    notes: "",
    niche: "",
    contact_name: "",
    contact_phone: "",
    contact_email: "",
    document: "",
    contract_status: "active",
    monthly_fee: null,
    billing_day: null,
    payment_method: "",
    contract_start: "",
    contract_end: "",
    services: [],
    ...initial,
  });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const set = (patch) => setClient((c) => ({ ...c, ...patch }));
  const toggleService = (s) => set({ services: client.services?.includes(s) ? client.services.filter((x) => x !== s) : [...(client.services || []), s] });

  async function submit(e) {
    e.preventDefault();
    if (client.contract_start && client.contract_end && client.contract_end < client.contract_start) {
      alert("A data de fim do contrato é anterior ao início.");
      return;
    }
    setSaving(true);
    let saved = await saveClient({ ...client, billing_day: client.billing_day ? Number(client.billing_day) : null });
    if (saved && file) saved = (await uploadContract(saved, file)) || saved;
    setSaving(false);
    if (saved) onDone?.(saved);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Section title="Perfil">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="cf-name">Nome do cliente *</label>
            <input id="cf-name" className="input" required value={client.name} onChange={(e) => set({ name: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="cf-ig">@ do Instagram</label>
            <input id="cf-ig" className="input" placeholder="@cliente" value={client.instagram_handle || ""} onChange={(e) => set({ instagram_handle: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="cf-niche">Nicho</label>
            <input id="cf-niche" className="input" list="cf-niches" placeholder="Ex.: Alimentação" value={client.niche || ""} onChange={(e) => set({ niche: e.target.value })} />
            <datalist id="cf-niches">{NICHES.map((n) => <option key={n} value={n} />)}</datalist>
          </div>
          <div>
            <span className="label">Cor</span>
            <div className="flex flex-wrap gap-2 pt-1.5">
              {COLORS.map((c) => (
                <button type="button" key={c} onClick={() => set({ color: c })} className={`h-7 w-7 rounded-full ring-offset-2 ${client.color === c ? "ring-2 ring-ink" : ""}`} style={{ background: c }} aria-label={`Cor ${c}`} />
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section title="Contato">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="cf-cname">Responsável</label>
            <input id="cf-cname" className="input" placeholder="Nome de quem aprova" value={client.contact_name || ""} onChange={(e) => set({ contact_name: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="cf-phone">WhatsApp</label>
            <input id="cf-phone" className="input" inputMode="tel" placeholder="(11) 90000-0000" value={client.contact_phone || ""} onChange={(e) => set({ contact_phone: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="cf-email">E-mail</label>
            <input id="cf-email" className="input" type="email" value={client.contact_email || ""} onChange={(e) => set({ contact_email: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="cf-doc">CPF / CNPJ</label>
            <input id="cf-doc" className="input" value={client.document || ""} onChange={(e) => set({ document: e.target.value })} />
          </div>
        </div>
      </Section>

      <Section title="Contrato e financeiro">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="cf-status">Status</label>
            <select id="cf-status" className="input" value={client.contract_status} onChange={(e) => set({ contract_status: e.target.value })}>
              {Object.entries(CONTRACT_STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="cf-fee">Valor mensal</label>
            <CurrencyInput id="cf-fee" value={client.monthly_fee} onChange={(v) => set({ monthly_fee: v })} />
          </div>
          <div>
            <label className="label" htmlFor="cf-day">Dia de vencimento</label>
            <input id="cf-day" className="input" type="number" min="1" max="31" placeholder="Ex.: 10" value={client.billing_day ?? ""} onChange={(e) => set({ billing_day: e.target.value ? Math.max(1, Math.min(31, Number(e.target.value))) : null })} />
          </div>
          <div>
            <label className="label" htmlFor="cf-pay">Forma de pagamento</label>
            <select id="cf-pay" className="input" value={client.payment_method || ""} onChange={(e) => set({ payment_method: e.target.value })}>
              <option value="">—</option>
              {PAYMENT_METHODS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="cf-start">Início do contrato</label>
            <input id="cf-start" className="input" type="date" value={client.contract_start || ""} onChange={(e) => set({ contract_start: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="cf-end">Fim / renovação</label>
            <input id="cf-end" className="input" type="date" value={client.contract_end || ""} onChange={(e) => set({ contract_end: e.target.value })} />
          </div>
        </div>

        <div>
          <span className="label">Serviços contratados</span>
          <div className="flex flex-wrap gap-2">
            {SERVICES.map((s) => {
              const on = client.services?.includes(s);
              return (
                <button type="button" key={s} onClick={() => toggleService(s)} className={`chip px-3 py-1.5 text-xs transition ${on ? "bg-brand text-white" : "bg-paper text-ink-soft ring-1 ring-line hover:text-ink"}`}>
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <span className="label">Arquivo do contrato</span>
          {file ? (
            <div className="flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm">
              <FileText size={16} className="text-brand" /> <span className="flex-1 truncate">{file.name}</span>
              <button type="button" onClick={() => setFile(null)} className="rounded p-1 hover:bg-paper" aria-label="Remover arquivo"><X size={14} /></button>
            </div>
          ) : (
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-dashed border-line px-3 py-3 text-sm text-ink-mute transition hover:border-brand-ring hover:text-brand">
              <Paperclip size={16} />
              {initial.contract_path ? "Substituir contrato (PDF, JPG ou PNG)" : "Anexar contrato (PDF, JPG ou PNG)"}
              <input type="file" accept="application/pdf,image/jpeg,image/png" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>
          )}
          <p className="mt-1 text-[11px] text-ink-mute">Fica guardado de forma privada: só a sua equipe consegue abrir.</p>
        </div>
      </Section>

      <Section title="Observações">
        <textarea className="input min-h-[80px]" placeholder="Tom de voz, restrições, combinados…" value={client.notes || ""} onChange={(e) => set({ notes: e.target.value })} />
      </Section>

      <div className="sticky -bottom-6 z-10 -mx-6 -mb-6 flex justify-end gap-2 rounded-b-3xl border-t border-line bg-white px-6 py-4">
        {onDone && <button type="button" onClick={() => onDone(null)} className="btn-ghost">Cancelar</button>}
        <button className="btn-primary" disabled={saving}>{saving ? "Salvando…" : "Salvar"}</button>
      </div>
    </form>
  );
}
