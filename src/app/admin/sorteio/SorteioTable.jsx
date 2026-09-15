"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function toCSVCell(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function formatDate(value) {
  return value ? new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR") : "";
}

export default function SorteioTable({ initialEntries }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const entries = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return initialEntries;
    return initialEntries.filter((entry) =>
      [entry.name, entry.cpf, entry.email, entry.phone, entry.raffle_number, entry.receipt_number].some((value) =>
        String(value || "").toLowerCase().includes(q)
      )
    );
  }, [initialEntries, query]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function exportCSV() {
    const header = ["Número", "Nome", "Celular", "CPF", "E-mail", "Nota fiscal", "Data da compra", "Cadastrado em"];
    const rows = entries.map((entry) => [
      entry.raffle_number,
      entry.name,
      entry.phone,
      entry.cpf,
      entry.email,
      entry.receipt_number,
      formatDate(entry.purchase_date),
      new Date(entry.created_at).toLocaleString("pt-BR"),
    ]);
    const csv = [header, ...rows].map((row) => row.map(toCSVCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sorteio-participantes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <Link href="/admin" className="text-sm font-semibold text-brand-red">
            ← Aprovação de cadastros
          </Link>
          <Link href="/" className="text-sm font-semibold text-[#8A8DA0]">
            App
          </Link>
        </div>
        <button onClick={handleLogout} className="text-sm font-semibold text-[#8A8DA0]">
          Sair
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          placeholder="Buscar por nome, CPF, e-mail ou número..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full max-w-sm rounded-md border border-[#DDE0E6] px-3 py-2 text-sm outline-none focus:border-brand-red"
        />
        <button
          onClick={exportCSV}
          disabled={entries.length === 0}
          className="whitespace-nowrap rounded-md bg-gradient-to-r from-brand-amber via-brand-orange to-brand-red px-3 py-2 text-sm font-bold text-white shadow-sm disabled:opacity-60"
        >
          Exportar CSV
        </button>
      </div>

      <div className="text-sm text-[#8A8DA0]">{entries.length} participante(s)</div>

      <div className="overflow-x-auto rounded-md border border-[#EAECEF] bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#EAECEF] text-xs font-bold uppercase tracking-wide text-[#8A8DA0]">
              <th className="px-4 py-3">Número</th>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Celular</th>
              <th className="px-4 py-3">CPF</th>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Nota fiscal</th>
              <th className="px-4 py-3">Data da compra</th>
              <th className="px-4 py-3">Cadastrado em</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-b border-[#EAECEF] last:border-0">
                <td className="px-4 py-3 font-bold text-brand-red">{entry.raffle_number}</td>
                <td className="px-4 py-3">{entry.name}</td>
                <td className="px-4 py-3">{entry.phone}</td>
                <td className="px-4 py-3">{entry.cpf}</td>
                <td className="px-4 py-3">{entry.email}</td>
                <td className="px-4 py-3">{entry.receipt_number}</td>
                <td className="px-4 py-3">{formatDate(entry.purchase_date)}</td>
                <td className="px-4 py-3">{new Date(entry.created_at).toLocaleString("pt-BR")}</td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-[#8A8DA0]">
                  Nenhum participante encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
