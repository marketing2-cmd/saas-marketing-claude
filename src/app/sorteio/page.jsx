"use client";

import { useState } from "react";
import { formatCPF, formatPhone } from "@/lib/cpf";

const initialForm = { name: "", phone: "", cpf: "", email: "", receiptNumber: "", purchaseDate: "" };

const inputClass =
  "w-full rounded-md border border-[#DDE0E6] px-3 py-2 text-sm outline-none focus:border-[#0038FF]";

function Field({ label, children }) {
  return (
    <div className="mb-4">
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#8A8DA0]">{label}</label>
      {children}
    </div>
  );
}

export default function SorteioPage() {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [raffleNumber, setRaffleNumber] = useState(null);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/sorteio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Não foi possível concluir o cadastro.");
      setRaffleNumber(data.raffleNumber);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (raffleNumber) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F6F3] px-4">
        <div className="w-full max-w-sm rounded-xl border border-[#DDE0E6] bg-white p-8 text-center shadow-sm">
          <h1 className="mb-2 text-lg font-bold text-[#0A0E1A]">Cadastro confirmado!</h1>
          <p className="mb-4 text-sm text-[#4A4E5C]">Guarde o seu número da sorte:</p>
          <div className="mb-6 rounded-lg bg-[#0038FF] py-4 text-3xl font-extrabold tracking-widest text-white">
            {raffleNumber}
          </div>
          <button
            onClick={() => {
              setForm(initialForm);
              setRaffleNumber(null);
            }}
            className="text-sm font-semibold text-[#0038FF]"
          >
            Cadastrar outra nota
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F6F3] px-4 py-10">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-xl border border-[#DDE0E6] bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[#0038FF]">
            <span className="font-bold text-white">M</span>
          </div>
          <h1 className="text-lg font-bold text-[#0A0E1A]">Participe do sorteio</h1>
          <p className="text-sm text-[#8A8DA0]">Preencha seus dados e os da nota da compra</p>
        </div>

        {error && <div className="mb-4 rounded-md bg-[#FBDEE1] px-3 py-2 text-sm text-[#E23744]">{error}</div>}

        <Field label="Nome completo">
          <input
            required
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Celular">
          <input
            required
            inputMode="numeric"
            placeholder="(11) 91234-5678"
            value={form.phone}
            onChange={(e) => update("phone", formatPhone(e.target.value))}
            className={inputClass}
          />
        </Field>

        <Field label="CPF">
          <input
            required
            inputMode="numeric"
            placeholder="000.000.000-00"
            value={form.cpf}
            onChange={(e) => update("cpf", formatCPF(e.target.value))}
            className={inputClass}
          />
        </Field>

        <Field label="E-mail">
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Número da nota fiscal">
          <input
            required
            value={form.receiptNumber}
            onChange={(e) => update("receiptNumber", e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Data da compra">
          <input
            required
            type="date"
            value={form.purchaseDate}
            onChange={(e) => update("purchaseDate", e.target.value)}
            className={inputClass}
          />
        </Field>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full rounded-md bg-[#0038FF] py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Enviando…" : "Participar do sorteio"}
        </button>
      </form>
    </div>
  );
}
