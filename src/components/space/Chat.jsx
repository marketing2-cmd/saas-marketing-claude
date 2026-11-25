"use client";

import { useEffect, useRef, useState } from "react";
import { Hash, Send, Link2, Settings2 } from "lucide-react";
import { useSpace } from "./store";
import { Avatar, Button, Modal, Field, inputCls, cx } from "./ui";
import { formatTime, colorFor, initials, capitalize } from "@/lib/space/model";

function GoogleChatIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path fill="#00AC47" d="M4 3h13a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H9l-5 4V3z" />
      <path fill="#fff" d="M8 8h8v1.6H8zM8 11.4h5.5V13H8z" />
    </svg>
  );
}

function dayLabel(iso) {
  const d = new Date(iso);
  const today = new Date();
  const y = new Date();
  y.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Hoje";
  if (d.toDateString() === y.toDateString()) return "Ontem";
  return capitalize(d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }));
}

export function ChatPage() {
  const { data, me, actions } = useSpace();
  const channels = [...data.channels].sort((a, b) => a.position - b.position);
  const [channelId, setChannelId] = useState(channels[0]?.id);
  const [text, setText] = useState("");
  const [config, setConfig] = useState(false);
  const endRef = useRef(null);
  const channel = data.channels.find((c) => c.id === channelId);
  const messages = data.messages.filter((m) => m.channel_id === channelId).sort((a, b) => a.created_at.localeCompare(b.created_at));

  useEffect(() => {
    if (!channelId && channels[0]) setChannelId(channels[0].id);
  }, [channels, channelId]);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, channelId]);

  function send(e) {
    e.preventDefault();
    if (!text.trim() || !channelId) return;
    actions.sendMessage(channelId, text.trim());
    setText("");
  }

  return (
    <div className="flex h-[calc(100vh-140px)] min-h-[420px] overflow-hidden rounded-2xl border border-line bg-surface">
      <aside className="hidden w-[220px] shrink-0 border-r border-line bg-canvas p-2 sm:block">
        <p className="px-2 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-muted">Canais</p>
        {channels.map((c) => {
          const sector = data.sectors.find((s) => s.id === c.sector_id);
          return (
            <button
              key={c.id}
              onClick={() => setChannelId(c.id)}
              className={cx("flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm", c.id === channelId ? "bg-surface font-semibold text-ink shadow-card" : "text-ink-2 hover:bg-hover")}
            >
              <Hash size={15} style={{ color: sector?.color || "#8A8DA0" }} />
              <span className="flex-1 truncate">{c.name}</span>
              {c.google_space_label && <GoogleChatIcon size={13} />}
            </button>
          );
        })}
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b border-line px-4 py-2.5">
          <select value={channelId || ""} onChange={(e) => setChannelId(e.target.value)} className="rounded-md border border-line px-2 py-1 text-sm sm:hidden">
            {channels.map((c) => (
              <option key={c.id} value={c.id}>
                #{c.name}
              </option>
            ))}
          </select>
          <h2 className="hidden items-center gap-1 text-[15px] font-bold text-ink sm:flex">
            <Hash size={17} className="text-muted" /> {channel?.name}
          </h2>
          {channel?.google_space_label ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
              <GoogleChatIcon size={12} /> Conectado: {channel.google_space_label}
            </span>
          ) : (
            <span className="hidden text-xs text-muted md:inline">Só no SpaceMais</span>
          )}
          <div className="flex-1" />
          {me?.isAdmin && channel && (
            <Button size="sm" variant="ghost" onClick={() => setConfig(true)} title="Conectar ao Google Chat">
              <Settings2 size={15} /> <span className="hidden md:inline">Google Chat</span>
            </Button>
          )}
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {messages.length === 0 && <p className="mt-10 text-center text-sm text-muted">Nenhuma mensagem em #{channel?.name}. Diga oi! 👋</p>}
          {messages.map((m, i) => {
            const prev = messages[i - 1];
            const newDay = !prev || new Date(prev.created_at).toDateString() !== new Date(m.created_at).toDateString();
            const grouped = !newDay && prev && prev.author_name === m.author_name && new Date(m.created_at) - new Date(prev.created_at) < 5 * 60000;
            const member = data.members.find((x) => x.id === m.author_id);
            const fallback = { id: m.author_name, name: m.author_name || "?" };
            return (
              <div key={m.id}>
                {newDay && (
                  <div className="my-4 flex items-center gap-3 text-xs font-semibold text-muted">
                    <span className="h-px flex-1 bg-line" /> {dayLabel(m.created_at)} <span className="h-px flex-1 bg-line" />
                  </div>
                )}
                <div className={cx("group flex gap-3 rounded-lg px-2 hover:bg-hover/50", grouped ? "py-0.5" : "mt-2 py-1")}>
                  <div className="w-8 shrink-0">
                    {!grouped &&
                      (member ? (
                        <Avatar member={member} size={32} />
                      ) : (
                        <span className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: colorFor(fallback.id) }}>
                          {initials(fallback.name)}
                        </span>
                      ))}
                  </div>
                  <div className="min-w-0 flex-1">
                    {!grouped && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-ink">{m.author_name || member?.name}</span>
                        <span className="text-[11px] text-muted">{formatTime(m.created_at)}</span>
                        {m.source === "google_chat" && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                            <GoogleChatIcon size={11} /> via Google Chat
                          </span>
                        )}
                      </div>
                    )}
                    <p className="whitespace-pre-wrap break-words text-sm text-ink-2">{m.body}</p>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        <form onSubmit={send} className="border-t border-line p-3">
          <div className="flex items-end gap-2 rounded-xl border border-line px-3 py-2 focus-within:border-brand">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) send(e);
              }}
              rows={1}
              placeholder={`Mensagem em #${channel?.name || ""}`}
              className="max-h-40 flex-1 resize-none bg-transparent py-1 text-sm outline-none"
            />
            <Button type="submit" size="sm" disabled={!text.trim()}>
              <Send size={15} />
            </Button>
          </div>
          {channel?.google_space_label && <p className="mt-1.5 px-1 text-[11px] text-muted">As mensagens daqui também aparecem no Google Chat ({channel.google_space_label}).</p>}
        </form>
      </section>
      {config && channel && <GoogleChatConfig channel={channel} onClose={() => setConfig(false)} />}
    </div>
  );
}

function GoogleChatConfig({ channel, onClose }) {
  const { actions, notify } = useSpace();
  const [f, setF] = useState({ googleWebhookUrl: "", googleSpaceName: "", label: channel.google_space_label || "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    actions
      .getIntegration(channel.id)
      .then((i) => i && setF((x) => ({ ...x, ...i, label: i.label || x.label })))
      .catch((e) => notify(e.message, "error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel.id]);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await actions.saveIntegration(channel.id, f);
      notify("Integração salva.");
      onClose();
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={`Google Chat · #${channel.name}`} onClose={onClose} width={560}>
      <form onSubmit={save} data-modal>
        <div className="mb-4 rounded-lg bg-canvas p-3 text-[13px] leading-relaxed text-ink-2">
          <p className="mb-1 font-semibold text-ink">Como conectar</p>
          <p>
            <b>1. Enviar daqui para o Google Chat:</b> no espaço do Google Chat, abra <i>Apps e integrações → Webhooks → Adicionar webhook</i> e cole a URL abaixo.
          </p>
          <p className="mt-1">
            <b>2. Receber do Google Chat aqui:</b> adicione o app <i>SpaceMais</i> ao espaço (configuração no README) e cole o ID do espaço — fica na URL do Google Chat, depois de <code>/room/</code> (ex.: <code>spaces/AAAAxyz</code>). As mensagens que mencionarem o app aparecem neste canal.
          </p>
        </div>
        <Field label="Nome do espaço no Google Chat (aparece no topo do canal)">
          <input value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} className={inputCls} placeholder="Ex.: Contattos+ | Marketing" />
        </Field>
        <Field label="URL do webhook (enviar)">
          <input value={f.googleWebhookUrl} disabled={loading} onChange={(e) => setF({ ...f, googleWebhookUrl: e.target.value })} className={inputCls} placeholder="https://chat.googleapis.com/v1/spaces/…/messages?key=…" />
        </Field>
        <Field label="ID do espaço (receber)">
          <input value={f.googleSpaceName} disabled={loading} onChange={(e) => setF({ ...f, googleSpaceName: e.target.value })} className={inputCls} placeholder="spaces/AAAAxyz" />
        </Field>
        <div className="flex items-center justify-end gap-2">
          <span className="mr-auto inline-flex items-center gap-1 text-xs text-muted">
            <Link2 size={13} /> Só administradores veem estas configurações.
          </span>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving || loading}>
            {saving ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
