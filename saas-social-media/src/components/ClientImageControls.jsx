"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useWorkspace } from "./WorkspaceProvider";

function useImagePicker(client, kind) {
  const { setClientImage } = useWorkspace();
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  async function apply(file) {
    setBusy(true);
    await setClientImage(client, kind, file);
    setBusy(false);
  }
  const picker = (
    <input
      ref={input}
      type="file"
      accept="image/jpeg,image/png,image/webp"
      hidden
      onChange={(e) => {
        const f = e.target.files?.[0];
        e.target.value = "";
        if (f) apply(f);
      }}
    />
  );
  return { busy, pick: () => input.current?.click(), remove: () => apply(null), picker };
}

// Botões sobre a capa (aparecem ao passar o mouse; sempre visíveis no celular)
export function CoverControls({ client }) {
  const { busy, pick, remove, picker } = useImagePicker(client, "cover");
  return (
    <div className={`absolute right-3 top-3 flex gap-2 transition sm:opacity-0 sm:group-hover:opacity-100 ${busy ? "!opacity-100" : ""}`}>
      {picker}
      <button type="button" onClick={pick} disabled={busy} className="btn bg-white/90 px-3 py-1.5 text-xs text-ink shadow-soft backdrop-blur hover:bg-white">
        {busy ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
        {client.cover_url ? "Trocar capa" : "Adicionar capa"}
      </button>
      {client.cover_url && !busy && (
        <button type="button" onClick={remove} className="btn bg-white/90 px-2.5 py-1.5 text-xs text-rose-600 shadow-soft backdrop-blur hover:bg-white" aria-label="Remover capa">
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}

// Selo de câmera sobre a foto de perfil, com menu para enviar ou remover
export function AvatarControls({ client }) {
  const { busy, pick, remove, picker } = useImagePicker(client, "avatar");
  const [open, setOpen] = useState(false);
  const box = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => !box.current?.contains(e.target) && setOpen(false);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  function onClick() {
    if (!client.avatar_url) return pick();
    setOpen((o) => !o);
  }

  return (
    <div ref={box} className="absolute bottom-0 right-0">
      {picker}
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        aria-label={client.avatar_url ? "Alterar foto de perfil" : "Adicionar foto de perfil"}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-white shadow-float ring-[3px] ring-white transition hover:bg-brand active:scale-95"
      >
        {busy ? <Loader2 size={15} className="animate-spin" /> : <Camera size={15} />}
      </button>
      {open && (
        <div className="absolute left-0 top-10 z-20 w-44 overflow-hidden rounded-xl border border-line bg-white py-1 text-sm shadow-float">
          <button type="button" onClick={() => { setOpen(false); pick(); }} className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-paper">
            <ImagePlus size={15} /> Trocar foto
          </button>
          <button type="button" onClick={() => { setOpen(false); remove(); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-rose-600 hover:bg-rose-50">
            <Trash2 size={15} /> Remover foto
          </button>
        </div>
      )}
    </div>
  );
}
