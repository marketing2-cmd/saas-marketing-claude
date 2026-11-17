"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Lightbulb, Link2, Loader2, MoreHorizontal, Pencil, Pin, PinOff, Plus, Search, Send, Trash2 } from "lucide-react";
import { useWorkspace } from "../WorkspaceProvider";
import Dialog from "../Dialog";
import Loading from "../Loading";
import PillarChip from "./PillarChip";
import { NOTE_KINDS, NOTE_STATUSES } from "@/lib/planning";

export default function IdeasBoard({ client, pillars }) {
  const { listNotes, saveNote, deleteNote, openEditor } = useWorkspace();
  const [notes, setNotes] = useState(null);
  const [kind, setKind] = useState("all");
  const [status, setStatus] = useState("open");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const pillarById = Object.fromEntries((pillars || []).map((p) => [p.id, p]));

  useEffect(() => {
    let alive = true;
    setNotes(null);
    listNotes(client.id).then((n) => alive && setNotes(n));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client.id]);

  async function persist(note) {
    const saved = await saveNote(client.id, note);
    if (saved) setNotes((list) => [saved, ...list.filter((n) => n.id !== saved.id)]);
    return saved;
  }

  async function remove(note) {
    if (!confirm("Excluir esta anotação?")) return;
    const before = notes;
    setNotes((list) => list.filter((n) => n.id !== note.id));
    if (!(await deleteNote(client.id, note.id))) setNotes(before);
  }

  async function toPost(note) {
    openEditor({
      client_id: client.id,
      title: note.title,
      caption: note.body,
      tags: pillarById[note.pillar_id]?.name ? [pillarById[note.pillar_id].name] : [],
    });
    if (note.status !== "used") persist({ ...note, status: "used" });
  }

  const visible = useMemo(() => {
    if (!notes) return [];
    const q = query.trim().toLowerCase();
    return notes
      .filter((n) => kind === "all" || n.kind === kind)
      .filter((n) => (status === "open" ? !["used", "discarded"].includes(n.status) : status === "all" ? true : n.status === status))
      .filter((n) => !q || `${n.title} ${n.body}`.toLowerCase().includes(q))
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || new Date(b.created_at) - new Date(a.created_at));
  }, [notes, kind, status, query]);

  if (!notes) return <Loading />;

  return (
    <div className="space-y-5">
      <QuickAdd pillars={pillars} onAdd={persist} />

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-xl border border-line bg-white p-1 text-sm">
          {[["all", "Tudo"], ["idea", "Ideias"], ["insight", "Insights"], ["reference", "Referências"]].map(([k, l]) => (
            <button key={k} onClick={() => setKind(k)} className={`rounded-lg px-3 py-1.5 font-semibold transition ${kind === k ? "bg-navy text-white" : "text-ink-soft hover:text-ink"}`}>
              {l} <span className="ml-0.5 text-[11px] opacity-70">{k === "all" ? notes.length : notes.filter((n) => n.kind === k).length}</span>
            </button>
          ))}
        </div>
        <select className="input w-auto py-2" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filtrar por status">
          <option value="open">Em aberto</option>
          <option value="all">Todas</option>
          {Object.entries(NOTE_STATUSES).map(([k, s]) => <option key={k} value={k}>{s.label}s</option>)}
        </select>
        <div className="relative ml-auto">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" />
          <input className="input w-56 py-2 pl-9" placeholder="Buscar…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="card p-10 text-center">
          <Lightbulb className="mx-auto text-amber-500" size={30} />
          <p className="mt-2 font-semibold">{notes.length ? "Nada com esses filtros." : "Nenhuma anotação ainda."}</p>
          <p className="text-sm text-ink-soft">Anote ideias de post, insights dos relatórios e referências que inspiram.</p>
        </div>
      ) : (
        <div className="columns-1 gap-4 md:columns-2 xl:columns-3 [&>*]:mb-4">
          {visible.map((n) => (
            <NoteCard
              key={n.id}
              note={n}
              pillar={pillarById[n.pillar_id]}
              onEdit={() => setEditing(n)}
              onPin={() => persist({ ...n, pinned: !n.pinned })}
              onStatus={(s) => persist({ ...n, status: s })}
              onDelete={() => remove(n)}
              onPost={() => toPost(n)}
            />
          ))}
        </div>
      )}

      {editing && (
        <NoteDialog
          note={editing}
          pillars={pillars}
          onClose={() => setEditing(null)}
          onSave={async (n) => {
            if (await persist(n)) setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function QuickAdd({ pillars, onAdd }) {
  const [kind, setKind] = useState("idea");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const area = useRef(null);

  async function add(e) {
    e?.preventDefault();
    const value = text.trim();
    if (!value) return;
    setBusy(true);
    const [first, ...rest] = value.split("\n");
    const saved = await onAdd({ kind, title: first.slice(0, 140), body: rest.join("\n").trim() || (first.length > 140 ? value : "") });
    setBusy(false);
    if (saved) {
      setText("");
      area.current?.focus();
    }
  }

  return (
    <form onSubmit={add} className="card p-4">
      <div className="mb-2 flex gap-1.5">
        {Object.entries(NOTE_KINDS).map(([k, v]) => (
          <button type="button" key={k} onClick={() => setKind(k)} className={`chip transition ${kind === k ? v.color + " ring-1 ring-current" : "bg-paper text-ink-mute hover:text-ink"}`}>{v.label}</button>
        ))}
      </div>
      <div className="flex items-end gap-2">
        <textarea
          ref={area}
          rows={2}
          className="input resize-none"
          placeholder={kind === "insight" ? "Ex.: Reels de bastidores tiveram o dobro de alcance este mês…" : kind === "reference" ? "Cole um link ou descreva a referência…" : "Anote uma ideia de post… (1ª linha vira o título)"}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) add(e);
          }}
        />
        <button className="btn-primary shrink-0 px-3.5" disabled={busy || !text.trim()} aria-label="Adicionar anotação">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} strokeWidth={2.5} />}
        </button>
      </div>
      <p className="mt-1.5 text-[11px] text-ink-mute">Ctrl + Enter para adicionar. Clique em uma anotação para editar detalhes, pilar e link.</p>
    </form>
  );
}

function NoteCard({ note, pillar, onEdit, onPin, onStatus, onDelete, onPost }) {
  const [menu, setMenu] = useState(false);
  const box = useRef(null);
  useEffect(() => {
    if (!menu) return;
    const close = (e) => !box.current?.contains(e.target) && setMenu(false);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [menu]);

  const k = NOTE_KINDS[note.kind];
  const st = NOTE_STATUSES[note.status];
  const faded = note.status === "discarded" || note.status === "used";

  return (
    <article className={`card group relative break-inside-avoid p-4 transition hover:shadow-float ${note.pinned ? "ring-1 ring-brand-ring" : ""} ${faded ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-2">
        <div className="flex flex-1 flex-wrap items-center gap-1.5">
          <span className={`chip ${k.color}`}>{k.label}</span>
          {note.status !== "new" && <span className={`chip ${st.color}`}>{st.label}</span>}
          {note.pinned && <Pin size={13} className="text-brand" aria-label="Fixada" />}
        </div>
        <div ref={box} className="relative">
          <button onClick={() => setMenu((m) => !m)} className="rounded-lg p-1 text-ink-mute hover:bg-paper hover:text-ink" aria-label="Ações"><MoreHorizontal size={16} /></button>
          {menu && (
            <div className="absolute right-0 top-8 z-20 w-48 overflow-hidden rounded-xl border border-line bg-white py-1 text-sm shadow-float">
              <MenuItem icon={Pencil} onClick={() => { setMenu(false); onEdit(); }}>Editar</MenuItem>
              <MenuItem icon={note.pinned ? PinOff : Pin} onClick={() => { setMenu(false); onPin(); }}>{note.pinned ? "Desafixar" : "Fixar no topo"}</MenuItem>
              <div className="my-1 border-t border-line" />
              {Object.entries(NOTE_STATUSES).filter(([s]) => s !== note.status).map(([s, v]) => (
                <MenuItem key={s} onClick={() => { setMenu(false); onStatus(s); }}>Marcar como {v.label.toLowerCase()}</MenuItem>
              ))}
              <div className="my-1 border-t border-line" />
              <MenuItem icon={Trash2} danger onClick={() => { setMenu(false); onDelete(); }}>Excluir</MenuItem>
            </div>
          )}
        </div>
      </div>
      <button onClick={onEdit} className="mt-2 block w-full text-left">
        {note.title && <h4 className="font-bold leading-snug">{note.title}</h4>}
        {note.body && <p className="mt-1 whitespace-pre-wrap text-sm text-ink-soft">{note.body}</p>}
      </button>
      {note.link && (
        <a href={note.link} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-1 truncate text-xs font-semibold text-brand hover:underline">
          <ExternalLink size={12} /> {note.link.replace(/^https?:\/\//, "")}
        </a>
      )}
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <PillarChip pillar={pillar} />
          <span className="text-[11px] text-ink-mute">{new Date(note.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</span>
        </div>
        {note.kind !== "reference" && note.status !== "discarded" && (
          <button onClick={onPost} className="btn-ghost shrink-0 px-2.5 py-1 text-xs"><Send size={13} /> Criar post</button>
        )}
      </div>
    </article>
  );
}

function MenuItem({ icon: Icon, danger, children, onClick }) {
  return (
    <button onClick={onClick} className={`flex w-full items-center gap-2 px-3 py-2 text-left ${danger ? "text-rose-600 hover:bg-rose-50" : "hover:bg-paper"}`}>
      {Icon ? <Icon size={15} /> : <span className="w-[15px]" />} {children}
    </button>
  );
}

function NoteDialog({ note, pillars, onClose, onSave }) {
  const [draft, setDraft] = useState(note);
  const [busy, setBusy] = useState(false);
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  return (
    <Dialog title="Editar anotação" onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          await onSave(draft);
          setBusy(false);
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Tipo</label>
            <select className="input" value={draft.kind} onChange={(e) => set({ kind: e.target.value })}>
              {Object.entries(NOTE_KINDS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={draft.status} onChange={(e) => set({ status: e.target.value })}>
              {Object.entries(NOTE_STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Título</label>
          <input className="input" value={draft.title} onChange={(e) => set({ title: e.target.value })} />
        </div>
        <div>
          <label className="label">Detalhes</label>
          <textarea className="input resize-y" rows={5} value={draft.body} onChange={(e) => set({ body: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Pilar</label>
            <select className="input" value={draft.pillar_id || ""} onChange={(e) => set({ pillar_id: e.target.value || null })}>
              <option value="">Sem pilar</option>
              {(pillars || []).map((p) => <option key={p.id} value={p.id}>{p.name || "Sem nome"}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Link</label>
            <div className="relative">
              <Link2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" />
              <input className="input pl-9" type="url" placeholder="https://…" value={draft.link || ""} onChange={(e) => set({ link: e.target.value })} />
            </div>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={Boolean(draft.pinned)} onChange={(e) => set({ pinned: e.target.checked })} className="h-4 w-4 accent-[#082B87]" /> Fixar no topo
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-ghost">Cancelar</button>
          <button className="btn-primary" disabled={busy}>Salvar</button>
        </div>
      </form>
    </Dialog>
  );
}
