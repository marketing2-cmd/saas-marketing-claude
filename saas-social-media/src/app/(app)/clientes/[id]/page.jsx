"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useWorkspace } from "@/components/WorkspaceProvider";
import ClientForm from "@/components/ClientForm";
import Dialog from "@/components/Dialog";
import Loading from "@/components/Loading";
import ClientHeader from "@/components/client/ClientHeader";
import ClientSections, { SECTIONS } from "@/components/client/ClientSections";
import ClientContent from "@/components/client/ClientContent";
import AiSoon from "@/components/client/AiSoon";
import PlanningArea from "@/components/planning/PlanningArea";

const LEGACY = { overview: "content", editorial: "positioning" };

export default function ClientPage() {
  const { id } = useParams();
  const params = useSearchParams();
  const router = useRouter();
  const { loading, clientById, accounts, deleteClient, reload, notify, href, demo } = useWorkspace();
  const [editing, setEditing] = useState(false);
  const [section, setSectionState] = useState(() => {
    const s = params.get("aba");
    const key = LEGACY[s] || s;
    return SECTIONS.some((x) => x.key === key) ? key : "content";
  });

  function setSection(next) {
    setSectionState(next);
    // Atualiza a URL sem recarregar (dá para voltar direto na seção)
    const url = new URL(window.location.href);
    if (next === "content") url.searchParams.delete("aba");
    else url.searchParams.set("aba", next);
    window.history.replaceState(null, "", url);
  }

  if (loading) return <Loading />;
  const client = clientById[id];
  if (!client) return <div className="py-20 text-center text-sm text-ink-mute">Cliente não encontrado.</div>;

  const account = accounts.find((a) => a.client_id === id);
  const metaError = params.get("meta_error");
  const connected = params.get("connected");

  async function remove() {
    if (!confirm(`Excluir ${client.name} e todos os posts dele? Isso não pode ser desfeito.`)) return;
    await deleteClient(id);
    router.push(href("/clientes"));
  }

  async function disconnect() {
    if (demo) return notify("Na demonstração as contas não são alteradas.");
    if (!confirm("Desconectar o Instagram deste cliente? Posts agendados não serão publicados.")) return;
    const res = await fetch("/api/meta/disconnect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ client_id: id }) });
    if (!res.ok) return notify("Não foi possível desconectar.", "error");
    await reload();
    notify("Instagram desconectado.");
  }

  return (
    <div className="space-y-5">
      <Link href={href("/clientes")} className="inline-flex items-center gap-1 text-sm font-medium text-ink-soft hover:text-ink"><ArrowLeft size={14} /> Todos os clientes</Link>

      <ClientHeader client={client} account={account} onEdit={() => setEditing(true)} onDelete={remove} onDisconnect={disconnect} />

      {connected && <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">Instagram conectado! Posts aprovados com data serão publicados automaticamente.</div>}
      {metaError && <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">Não foi possível conectar o Instagram: {metaError}</div>}

      <ClientSections value={section} onChange={setSection} />

      <div>
        {section === "content" && <ClientContent client={client} />}
        {section === "ai" && <AiSoon />}
        <PlanningArea client={client} section={section} />
      </div>

      {editing && (
        <Dialog title="Editar cliente" size="lg" onClose={() => setEditing(false)}>
          <ClientForm initial={client} onDone={() => setEditing(false)} />
        </Dialog>
      )}
    </div>
  );
}
