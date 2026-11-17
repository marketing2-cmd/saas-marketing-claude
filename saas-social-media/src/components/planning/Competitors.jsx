"use client";

import { ExternalLink } from "lucide-react";
import { uid } from "@/lib/planning";
import { AddButton, EmptyAdd, RemoveButton, SectionHeader, TextArea, TextInput, useListField } from "./fields";

export default function Competitors({ strategy, update }) {
  const { items, add, set, remove } = useListField(strategy, update, "competitors");
  const blank = () => ({ id: uid(), name: "", handle: "", link: "", strengths: "", weaknesses: "", notes: "" });

  return (
    <div className="pb-24">
      <SectionHeader
        title="Concorrência"
        description="Quem disputa a atenção do mesmo público e o que aprender com cada um."
        action={items.length > 0 && <AddButton onClick={() => add(blank())}>Adicionar concorrente</AddButton>}
      />
      {items.length === 0 && <EmptyAdd onClick={() => add(blank())}>Nenhum concorrente mapeado. Clique para adicionar.</EmptyAdd>}
      <div className="grid gap-5 lg:grid-cols-2">
        {items.map((c) => {
          const profile = c.link || (c.handle ? `https://instagram.com/${c.handle.replace(/^@/, "")}` : null);
          return (
            <section key={c.id} className="card p-5">
              <div className="flex items-start gap-2">
                <div className="grid flex-1 gap-3 sm:grid-cols-2">
                  <TextInput label="Nome" value={c.name} onChange={(v) => set(c.id, { name: v })} placeholder="Ex.: Doce Ponto" />
                  <TextInput label="@ do Instagram" value={c.handle} onChange={(v) => set(c.id, { handle: v })} placeholder="@concorrente" />
                </div>
                <RemoveButton onClick={() => confirm("Remover este concorrente?") && remove(c.id)} label="Remover concorrente" />
              </div>
              {profile && (
                <a href={profile} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline">
                  <ExternalLink size={12} /> Abrir perfil
                </a>
              )}
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <TextArea label="Pontos fortes" rows={3} value={c.strengths} onChange={(v) => set(c.id, { strengths: v })} placeholder="O que fazem bem" />
                <TextArea label="Pontos fracos" rows={3} value={c.weaknesses} onChange={(v) => set(c.id, { weaknesses: v })} placeholder="Onde dá para se destacar" />
              </div>
              <div className="mt-4">
                <TextArea label="Observações" rows={2} value={c.notes} onChange={(v) => set(c.id, { notes: v })} placeholder="Frequência, formatos, horários, campanhas…" />
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
