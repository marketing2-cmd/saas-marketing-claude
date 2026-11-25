"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createAdapter, TABLES, uid } from "@/lib/space/data";
import { toISODate } from "@/lib/space/model";

const SpaceContext = createContext(null);
export const useSpace = () => useContext(SpaceContext);

const EMPTY = Object.fromEntries(Object.values(TABLES).map((k) => [k, []]));

function upsert(list, row) {
  const i = list.findIndex((r) => r.id === row.id);
  if (i === -1) return [...list, row];
  const next = list.slice();
  next[i] = { ...next[i], ...row };
  return next;
}

export function SpaceProvider({ children }) {
  const adapterRef = useRef(null);
  if (!adapterRef.current) adapterRef.current = createAdapter();
  const adapter = adapterRef.current;

  const [data, setData] = useState(EMPTY);
  const [me, setMe] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const notify = useCallback((message, kind = "info") => {
    setToast({ message, kind, at: Date.now() });
    setTimeout(() => setToast((t) => (t && Date.now() - t.at >= 2900 ? null : t)), 3000);
  }, []);

  useEffect(() => {
    let unsub = () => {};
    adapter
      .loadAll()
      .then(({ data, me }) => {
        setData({ ...EMPTY, ...data });
        setMe(me);
        setStatus("ready");
        unsub = adapter.subscribe(({ table, type, row, old }) => {
          const key = TABLES[table];
          setData((d) => ({
            ...d,
            [key]: type === "DELETE" ? d[key].filter((r) => r.id !== old?.id) : upsert(d[key], row),
          }));
        });
      })
      .catch((e) => {
        setError(e.message || String(e));
        setStatus("error");
      });
    return () => unsub();
  }, [adapter]);

  // ---- CRUD otimista: muda a tela na hora, desfaz se o banco recusar ----------
  const create = useCallback(
    async (table, row) => {
      const full = { id: uid(), ...row };
      const key = TABLES[table];
      setData((d) => ({ ...d, [key]: upsert(d[key], full) }));
      try {
        await adapter.insert(table, full);
      } catch (e) {
        setData((d) => ({ ...d, [key]: d[key].filter((r) => r.id !== full.id) }));
        notify("Não foi possível salvar: " + (e.message || e), "error");
      }
      return full;
    },
    [adapter, notify]
  );

  const update = useCallback(
    async (table, id, patch) => {
      const key = TABLES[table];
      let before;
      setData((d) => {
        before = d[key].find((r) => r.id === id);
        return { ...d, [key]: d[key].map((r) => (r.id === id ? { ...r, ...patch } : r)) };
      });
      try {
        await adapter.update(table, id, patch);
      } catch (e) {
        if (before) setData((d) => ({ ...d, [key]: upsert(d[key], before) }));
        notify("Não foi possível salvar: " + (e.message || e), "error");
      }
    },
    [adapter, notify]
  );

  const remove = useCallback(
    async (table, id) => {
      const key = TABLES[table];
      let before;
      setData((d) => {
        before = d[key].find((r) => r.id === id);
        return { ...d, [key]: d[key].filter((r) => r.id !== id) };
      });
      try {
        await adapter.remove(table, id);
      } catch (e) {
        if (before) setData((d) => ({ ...d, [key]: upsert(d[key], before) }));
        notify("Não foi possível excluir: " + (e.message || e), "error");
      }
    },
    [adapter, notify]
  );

  // ---- ações de domínio ------------------------------------------------------
  const actions = useMemo(
    () => ({
      createTask: (fields) => {
        const now = new Date().toISOString();
        return create("sm_tasks", {
          title: "",
          description: "",
          status: "todo",
          priority: "medium",
          checklist: [],
          position: Date.now(),
          created_by: me?.id || null,
          created_at: now,
          updated_at: now,
          ...fields,
        });
      },
      updateTask: (id, patch) => {
        const extra = { updated_at: new Date().toISOString() };
        if (patch.status) extra.completed_at = patch.status === "done" ? new Date().toISOString() : null;
        return update("sm_tasks", id, { ...patch, ...extra });
      },
      deleteTask: (id) => remove("sm_tasks", id),
      addComment: (taskId, body) =>
        create("sm_task_comments", { task_id: taskId, author_id: me?.id, body, created_at: new Date().toISOString() }),

      createProject: (fields) =>
        create("sm_projects", { description: "", archived: false, created_by: me?.id, created_at: new Date().toISOString(), ...fields }),
      updateProject: (id, patch) => update("sm_projects", id, patch),
      deleteProject: (id) => remove("sm_projects", id),

      createRoutine: (fields) => create("sm_routines", { active: true, created_at: new Date().toISOString(), ...fields }),
      updateRoutine: (id, patch) => update("sm_routines", id, patch),
      deleteRoutine: (id) => remove("sm_routines", id),
      toggleCheck: (routine, periodKey, done) => {
        const id = `${routine.id}:${periodKey}`;
        if (done) return create("sm_routine_checks", { id, routine_id: routine.id, period_key: periodKey, done_by: me?.id, done_at: new Date().toISOString() });
        return remove("sm_routine_checks", id);
      },

      createMinute: (fields) => {
        const now = new Date().toISOString();
        return create("sm_minutes", {
          title: "",
          meeting_date: toISODate(),
          participants: me?.id ? [me.id] : [],
          notes: "",
          decisions: "",
          sector_id: data.members.find((m) => m.id === me?.id)?.sector_id || null,
          created_by: me?.id,
          created_at: now,
          updated_at: now,
          ...fields,
        });
      },
      updateMinute: (id, patch) => update("sm_minutes", id, { ...patch, updated_at: new Date().toISOString() }),
      deleteMinute: (id) => remove("sm_minutes", id),

      updateMe: (patch) => update("sm_members", me?.id, patch),

      sendMessage: async (channelId, body) => {
        const author = data.members.find((m) => m.id === me?.id);
        const msg = {
          id: uid(),
          channel_id: channelId,
          author_id: me?.id,
          author_name: author?.name || me?.email || "",
          body,
          source: "space",
          created_at: new Date().toISOString(),
        };
        setData((d) => ({ ...d, messages: upsert(d.messages, msg) }));
        try {
          await adapter.sendMessage(msg);
        } catch (e) {
          setData((d) => ({ ...d, messages: d.messages.filter((m) => m.id !== msg.id) }));
          notify(e.message, "error");
        }
      },
      getIntegration: (channelId) => adapter.getIntegration(channelId),
      saveIntegration: async (channelId, integration) => {
        await adapter.saveIntegration(channelId, integration);
        setData((d) => ({
          ...d,
          channels: d.channels.map((c) => (c.id === channelId ? { ...c, google_space_label: integration.label || "" } : c)),
        }));
      },
      signOut: () => adapter.signOut(),
    }),
    [create, update, remove, me, data.members, adapter, notify]
  );

  const value = { data, me, status, error, actions, notify, toast, demo: adapter.demo };
  return <SpaceContext.Provider value={value}>{children}</SpaceContext.Provider>;
}
