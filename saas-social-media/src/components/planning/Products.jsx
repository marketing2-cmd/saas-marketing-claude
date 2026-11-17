"use client";

import { Package } from "lucide-react";
import CurrencyInput from "../CurrencyInput";
import { uid } from "@/lib/planning";
import { AddButton, EmptyAdd, RemoveButton, SectionHeader, TextArea, TextInput, useListField } from "./fields";

export default function Products({ strategy, update }) {
  const { items, add, set, remove } = useListField(strategy, update, "products");
  const blank = () => ({ id: uid(), name: "", price: null, description: "", differential: "", link: "" });

  return (
    <div className="pb-24">
      <SectionHeader
        title="Produtos e serviços"
        description="O que o cliente vende: base para legendas, campanhas e chamadas para ação."
        action={items.length > 0 && <AddButton onClick={() => add(blank())}>Adicionar produto</AddButton>}
      />
      {items.length === 0 && <EmptyAdd onClick={() => add(blank())}>Nenhum produto cadastrado. Clique para adicionar.</EmptyAdd>}
      <div className="grid gap-5 lg:grid-cols-2">
        {items.map((p) => (
          <section key={p.id} className="card p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand"><Package size={20} /></span>
              <div className="grid flex-1 gap-3 sm:grid-cols-[1fr_150px]">
                <TextInput label="Nome" value={p.name} onChange={(v) => set(p.id, { name: v })} placeholder="Ex.: Caixa presente 12 doces" />
                <div>
                  <label className="label">Preço</label>
                  <CurrencyInput value={p.price} onChange={(v) => set(p.id, { price: v })} />
                </div>
              </div>
              <RemoveButton onClick={() => confirm("Remover este produto?") && remove(p.id)} label="Remover produto" />
            </div>
            <div className="mt-4 space-y-4">
              <TextArea label="Descrição" rows={2} value={p.description} onChange={(v) => set(p.id, { description: v })} placeholder="O que é e para quem é" />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput label="Diferencial" value={p.differential} onChange={(v) => set(p.id, { differential: v })} placeholder="Por que escolher este" />
                <TextInput label="Link de venda" type="url" value={p.link} onChange={(v) => set(p.id, { link: v })} placeholder="https://…" />
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
