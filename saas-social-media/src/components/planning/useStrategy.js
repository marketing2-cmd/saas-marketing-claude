"use client";

import { useCallback, useEffect, useState } from "react";
import { useWorkspace } from "../WorkspaceProvider";

// Linha editorial + cronograma semanal ficam no mesmo registro; o estado vive
// na página do cliente para as abas compartilharem (e não sobrescreverem) as edições.
export default function useStrategy(clientId) {
  const { getStrategy, saveStrategy, notify } = useWorkspace();
  const [strategy, setStrategy] = useState(null);
  const [saved, setSaved] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    setStrategy(null);
    getStrategy(clientId).then((s) => {
      if (!alive) return;
      setStrategy(s);
      setSaved(JSON.stringify(s));
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const dirty = strategy !== null && JSON.stringify(strategy) !== saved;

  useEffect(() => {
    if (!dirty) return;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const update = useCallback((patch) => setStrategy((s) => ({ ...s, ...(typeof patch === "function" ? patch(s) : patch) })), []);

  async function save() {
    setSaving(true);
    const res = await saveStrategy(clientId, strategy);
    setSaving(false);
    if (res) {
      setSaved(JSON.stringify(strategy));
      notify("Planejamento salvo.");
    }
  }

  function discard() {
    setStrategy(JSON.parse(saved));
  }

  return { strategy, update, dirty, saving, save, discard, loaded: strategy !== null };
}
