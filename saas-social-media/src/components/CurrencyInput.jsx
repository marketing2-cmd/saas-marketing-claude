"use client";

// Campo de dinheiro em reais: o usuário digita só números e o valor é formatado
// (ex.: 150000 → R$ 1.500,00). onChange recebe um número ou null.
export default function CurrencyInput({ value, onChange, id, placeholder = "R$ 0,00", className = "" }) {
  const display =
    value === null || value === undefined || value === ""
      ? ""
      : Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  function handle(e) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 12);
    onChange(digits ? Number(digits) / 100 : null);
  }

  return <input id={id} inputMode="numeric" className={`input ${className}`} placeholder={placeholder} value={display} onChange={handle} />;
}
