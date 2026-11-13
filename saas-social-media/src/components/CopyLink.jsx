"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export default function CopyLink({ path, label = "Copiar link de aprovação" }) {
  const [copied, setCopied] = useState(false);
  async function copy(e) {
    e.stopPropagation();
    e.preventDefault();
    await navigator.clipboard.writeText(`${window.location.origin}${path}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={copy} className="btn-ghost px-3 py-1.5 text-xs">
      {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />} {copied ? "Copiado!" : label}
    </button>
  );
}
