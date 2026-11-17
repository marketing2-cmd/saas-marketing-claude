"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, ChevronDown, ExternalLink, FileText, Instagram, Link2, Mail, MessageCircle, Paperclip, Pencil, Trash2 } from "lucide-react";
import { useWorkspace } from "../WorkspaceProvider";
import { Avatar } from "../PostPreview";
import ClientCover from "../ClientCover";
import CopyLink from "../CopyLink";
import { AvatarControls, CoverControls } from "../ClientImageControls";
import { CONTRACT_STATUSES, daysUntil, formatBRL, formatDate, whatsappLink } from "@/lib/clients";
import MemberAvatar from "../MemberAvatar";
import { STAGES } from "@/lib/posts";
import { memberName, membersForStage } from "@/lib/team";

function IconButton({ label, onClick, href, danger, children }) {
  const cls = `flex h-10 w-10 items-center justify-center rounded-xl border transition active:scale-95 ${
    danger ? "border-rose-500 bg-rose-500 text-white hover:bg-rose-600" : "border-line bg-white text-ink-soft hover:border-brand-ring hover:text-brand"
  }`;
  if (href) return <Link href={href} className={cls} aria-label={label} title={label}>{children}</Link>;
  return <button onClick={onClick} className={cls} aria-label={label} title={label}>{children}</button>;
}

function Detail({ label, children }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-mute">{label}</div>
      <div className="mt-0.5 text-sm">{children || <span className="text-ink-mute">—</span>}</div>
    </div>
  );
}

export default function ClientHeader({ client, account, onEdit, onDelete, onDisconnect }) {
  const { href, demo, notify, uploadContract, removeContract, contractUrl, members, memberById, saveClient } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const status = CONTRACT_STATUSES[client.contract_status] || CONTRACT_STATUSES.active;
  const portalPath = demo ? "/demo/portal" : `/c/${client.approval_token}`;
  const handle = client.instagram_handle?.replace(/^@/, "");
  const left = daysUntil(client.contract_end);
  const wa = whatsappLink(client.contact_phone);

  useEffect(() => {
    try {
      setOpen(localStorage.getItem("client_details_open") === "1");
    } catch {}
  }, []);
  function toggle() {
    setOpen((o) => {
      try {
        localStorage.setItem("client_details_open", o ? "0" : "1");
      } catch {}
      return !o;
    });
  }

  async function copyPortal() {
    await navigator.clipboard.writeText(`${window.location.origin}${portalPath}`);
    setCopied(true);
    notify("Link de aprovação copiado.");
    setTimeout(() => setCopied(false), 2000);
  }

  async function openContract() {
    const url = await contractUrl(client.contract_path);
    if (url) window.open(url, "_blank", "noopener");
  }

  return (
    <div className="card overflow-hidden">
      <ClientCover client={client} className="group h-24 sm:h-28">
        <CoverControls client={client} />
      </ClientCover>

      <div className="flex flex-wrap items-center gap-4 px-5 pb-4">
        <div className="relative -mt-8 shrink-0 rounded-2xl bg-white p-1 shadow-soft">
          <Avatar client={client} size={72} />
          <AvatarControls client={client} />
        </div>
        <div className="min-w-0 flex-1 pt-2">
          <h1 className="truncate text-2xl font-bold tracking-tight">{client.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-mute">
            {handle && <span>@{handle}</span>}
            {client.niche && <span className="chip bg-white text-ink-soft ring-1 ring-line">{client.niche}</span>}
            <span className={`chip ${status.color}`}><span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />{status.label}</span>
            {client.monthly_fee !== null && client.monthly_fee !== undefined && <span className="chip bg-paper text-ink-soft">{formatBRL(client.monthly_fee)}/mês</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 pt-2">
          <IconButton label={copied ? "Copiado!" : "Copiar link de aprovação"} onClick={copyPortal}><Link2 size={17} /></IconButton>
          <IconButton label="Relatório" href={href(`/relatorios?client=${client.id}`)}><BarChart3 size={17} /></IconButton>
          <IconButton label="Editar cliente" onClick={onEdit}><Pencil size={17} /></IconButton>
          <IconButton label="Excluir cliente" danger onClick={onDelete}><Trash2 size={17} /></IconButton>
          <button onClick={toggle} className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-soft hover:bg-paper" aria-expanded={open} aria-label={open ? "Ocultar detalhes" : "Mostrar detalhes"} title={open ? "Ocultar detalhes" : "Mostrar detalhes"}>
            <ChevronDown size={18} className={`transition ${open ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {open && members.length > 0 && (
        <div className="border-t border-line bg-white px-5 py-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold">Equipe deste cliente</h3>
            <span className="text-xs text-ink-mute">Responsáveis padrão para os novos conteúdos</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {STAGES.map((st) => {
              const current = client.default_team?.[st.key] || "";
              return (
                <label key={st.key} className="flex items-center gap-2 rounded-xl border border-line px-3 py-2">
                  <MemberAvatar member={memberById[current]} size={26} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-semibold uppercase tracking-wider text-ink-mute">{st.label}</span>
                    <select
                      className="w-full bg-transparent text-sm font-medium outline-none"
                      value={current}
                      onChange={(e) => saveClient({ ...client, default_team: { ...(client.default_team || {}), [st.key]: e.target.value || null } }, { silent: true }).then((ok) => ok && notify("Equipe do cliente atualizada."))}
                    >
                      <option value="">Sem responsável</option>
                      {membersForStage(members, st.key).map((m) => <option key={m.user_id} value={m.user_id}>{memberName(m)}</option>)}
                    </select>
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {open && (
        <div className="grid gap-5 border-t border-line bg-paper/50 px-5 py-5 sm:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-3">
            <h3 className="text-sm font-bold">Contato</h3>
            <Detail label="Responsável">{client.contact_name}</Detail>
            <Detail label="WhatsApp">
              {client.contact_phone && (wa ? <a href={wa} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-emerald-700 hover:underline"><MessageCircle size={14} />{client.contact_phone}</a> : client.contact_phone)}
            </Detail>
            <Detail label="E-mail">{client.contact_email && <a href={`mailto:${client.contact_email}`} className="inline-flex items-center gap-1 hover:underline"><Mail size={14} />{client.contact_email}</a>}</Detail>
            <Detail label="CPF / CNPJ">{client.document}</Detail>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold">Contrato</h3>
            <Detail label="Vigência">
              {client.contract_start || client.contract_end ? `${formatDate(client.contract_start)} → ${formatDate(client.contract_end)}` : null}
            </Detail>
            {left !== null && (
              <div className={`chip ${left < 0 ? "bg-rose-100 text-rose-600" : left <= 30 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                {left < 0 ? `Venceu há ${-left} dias` : left === 0 ? "Vence hoje" : `Vence em ${left} dias`}
              </div>
            )}
            <Detail label="Arquivo">
              {client.contract_path ? (
                <span className="flex flex-wrap items-center gap-2">
                  <button onClick={openContract} className="inline-flex items-center gap-1 font-semibold text-brand hover:underline"><FileText size={14} /> Abrir contrato</button>
                  <button onClick={() => confirm("Remover o arquivo do contrato?") && removeContract(client)} className="text-xs text-ink-mute hover:text-rose-600">remover</button>
                </span>
              ) : (
                <label className="inline-flex cursor-pointer items-center gap-1 font-semibold text-brand hover:underline">
                  <Paperclip size={14} /> Anexar contrato
                  <input type="file" accept="application/pdf,image/jpeg,image/png" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) uploadContract(client, f).then((ok) => ok && notify("Contrato anexado.")); }} />
                </label>
              )}
            </Detail>
            {client.services?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {client.services.map((s) => <span key={s} className="chip bg-brand-soft text-brand">{s}</span>)}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold">Financeiro</h3>
            <Detail label="Valor mensal"><b className="text-base">{formatBRL(client.monthly_fee)}</b></Detail>
            <Detail label="Vencimento">{client.billing_day ? `Todo dia ${client.billing_day}` : null}</Detail>
            <Detail label="Forma de pagamento">{client.payment_method}</Detail>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold">Instagram e aprovação</h3>
            {account ? (
              <Detail label="Publicação automática">
                <span className="font-medium text-emerald-700">@{account.username} conectado</span>{" "}
                <button onClick={onDisconnect} className="text-xs text-ink-mute hover:text-rose-600">desconectar</button>
              </Detail>
            ) : (
              <Detail label="Publicação automática">
                {demo ? (
                  <button onClick={() => notify("Na demonstração não é possível conectar contas.")} className="inline-flex items-center gap-1 font-semibold text-brand hover:underline"><Instagram size={14} /> Conectar Instagram</button>
                ) : (
                  <a href={`/api/meta/connect?client_id=${client.id}`} className="inline-flex items-center gap-1 font-semibold text-brand hover:underline"><Instagram size={14} /> Conectar Instagram</a>
                )}
              </Detail>
            )}
            <Detail label="Link de aprovação do cliente">
              <span className="mt-1 flex flex-wrap gap-2">
                <CopyLink path={portalPath} label="Copiar" />
                <a href={portalPath} target="_blank" rel="noreferrer" className="btn-ghost px-3 py-1.5 text-xs"><ExternalLink size={14} /> Abrir</a>
              </span>
            </Detail>
            {client.notes && <Detail label="Observações"><span className="whitespace-pre-wrap text-ink-soft">{client.notes}</span></Detail>}
          </div>
        </div>
      )}
    </div>
  );
}
