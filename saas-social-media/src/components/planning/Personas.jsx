"use client";

import { Quote, UserRound } from "lucide-react";
import { uid } from "@/lib/planning";
import { AddButton, EmptyAdd, RemoveButton, SectionHeader, TextArea, TextInput, useListField } from "./fields";

export default function Personas({ strategy, update }) {
  const { items, add, set, remove } = useListField(strategy, update, "personas");
  const blank = () => ({ id: uid(), name: "", age: "", occupation: "", pains: "", desires: "", objections: "", channels: "", quote: "" });

  return (
    <div className="pb-24">
      <SectionHeader
        title="Persona"
        description="Quem é o cliente ideal: o que sente, o que deseja e o que impede a compra."
        action={items.length > 0 && <AddButton onClick={() => add(blank())}>Adicionar persona</AddButton>}
      />
      {items.length === 0 && <EmptyAdd onClick={() => add(blank())}>Nenhuma persona ainda. Clique para criar a primeira.</EmptyAdd>}
      <div className="space-y-5">
        {items.map((p) => (
          <section key={p.id} className="card p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand"><UserRound size={22} /></span>
              <div className="grid flex-1 gap-3 sm:grid-cols-3">
                <TextInput label="Nome da persona" value={p.name} onChange={(v) => set(p.id, { name: v })} placeholder="Ex.: Mariana, a presenteadora" />
                <TextInput label="Idade" value={p.age} onChange={(v) => set(p.id, { age: v })} placeholder="Ex.: 28 a 35 anos" />
                <TextInput label="Profissão / momento de vida" value={p.occupation} onChange={(v) => set(p.id, { occupation: v })} placeholder="Ex.: analista, mãe de 2" />
              </div>
              <RemoveButton onClick={() => confirm("Remover esta persona?") && remove(p.id)} label="Remover persona" />
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <TextArea label="Dores" value={p.pains} onChange={(v) => set(p.id, { pains: v })} placeholder="O que incomoda, preocupa ou trava" />
              <TextArea label="Desejos" value={p.desires} onChange={(v) => set(p.id, { desires: v })} placeholder="O que ela quer conquistar" />
              <TextArea label="Objeções" value={p.objections} onChange={(v) => set(p.id, { objections: v })} placeholder="Por que ainda não comprou" />
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <TextInput label="Onde consome conteúdo" value={p.channels} onChange={(v) => set(p.id, { channels: v })} placeholder="Ex.: Instagram, TikTok, YouTube" />
              <div>
                <label className="label">Frase que ela diria</label>
                <div className="relative">
                  <Quote size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" />
                  <input className="input pl-9 italic" value={p.quote || ""} onChange={(e) => set(p.id, { quote: e.target.value })} placeholder="Ex.: Quero algo bonito que chegue hoje ainda." />
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
