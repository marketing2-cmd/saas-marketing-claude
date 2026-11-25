"use client";

// Camada de dados do SpaceMais.
//
// Dois "adaptadores" com a mesma interface:
//   * supabase → produção: lê/grava direto nas tabelas sm_* com a publishable key
//                (RLS libera tudo para usuários aprovados) e recebe mudanças em tempo
//                real pelo Supabase Realtime. Envio de mensagens passa pela rota
//                /api/space/chat/send (que repassa ao Google Chat).
//   * demo     → NEXT_PUBLIC_SPACE_DEMO=1: tudo no localStorage, com dados de exemplo.
//                Serve para treinar a equipe e testar sem banco.

import { createClient } from "@/lib/supabase/client";
import { demoSeed, DEMO_USER_ID } from "./demo";

export const TABLES = {
  sm_sectors: "sectors",
  sm_members: "members",
  sm_projects: "projects",
  sm_tasks: "tasks",
  sm_task_comments: "comments",
  sm_routines: "routines",
  sm_routine_checks: "checks",
  sm_minutes: "minutes",
  sm_channels: "channels",
  sm_messages: "messages",
};

export const isDemo = process.env.NEXT_PUBLIC_SPACE_DEMO === "1";

export function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function createAdapter() {
  return isDemo ? demoAdapter() : supabaseAdapter();
}

// ---------------------------------------------------------------------------
function supabaseAdapter() {
  // Criado só no primeiro uso (no navegador) — o prerender do Next roda sem as envs.
  let client;
  const sb = () => (client ||= createClient());

  return {
    demo: false,

    async loadAll() {
      const { data: auth } = await sb().auth.getUser();
      const user = auth?.user;
      if (!user) throw new Error("Sessão expirada. Entre novamente.");

      const { data: profile } = await sb().from("profiles").select("role").eq("id", user.id).maybeSingle();

      // Garante que a pessoa logada aparece na lista de membros.
      const { data: existing } = await sb().from("sm_members").select("*").eq("id", user.id).maybeSingle();
      if (!existing) {
        await sb().from("sm_members").insert({
          id: user.id,
          email: user.email,
          name: nameFromEmail(user.email),
        });
      }

      const out = {};
      await Promise.all(
        Object.entries(TABLES).map(async ([table, key]) => {
          let q = sb().from(table).select("*");
          if (table === "sm_messages") q = q.order("created_at", { ascending: false }).limit(1000);
          const { data, error } = await q;
          if (error) throw new Error(`${table}: ${error.message}`);
          out[key] = table === "sm_messages" ? (data || []).reverse() : data || [];
        })
      );
      return { data: out, me: { id: user.id, email: user.email, isAdmin: profile?.role === "admin" } };
    },

    async insert(table, row) {
      const { error } = await sb().from(table).insert(row);
      if (error) throw error;
    },
    async update(table, id, patch) {
      const { error } = await sb().from(table).update(patch).eq("id", id);
      if (error) throw error;
    },
    async remove(table, id) {
      const { error } = await sb().from(table).delete().eq("id", id);
      if (error) throw error;
    },

    subscribe(onChange) {
      const channel = sb()
        .channel("space-mais")
        .on("postgres_changes", { event: "*", schema: "public" }, (payload) => {
          if (!TABLES[payload.table]) return;
          onChange({ table: payload.table, type: payload.eventType, row: payload.new, old: payload.old });
        })
        .subscribe();
      return () => sb().removeChannel(channel);
    },

    async sendMessage(message) {
      const res = await fetch("/api/space/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: message.id, channelId: message.channel_id, body: message.body }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Não foi possível enviar a mensagem.");
      return json;
    },

    async getIntegration(channelId) {
      const res = await fetch(`/api/space/admin/channel-integration?channelId=${encodeURIComponent(channelId)}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Erro ao carregar integração.");
      return json.integration;
    },
    async saveIntegration(channelId, integration) {
      const res = await fetch("/api/space/admin/channel-integration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId, ...integration }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Erro ao salvar integração.");
      return json;
    },

    async signOut() {
      await sb().auth.signOut();
      window.location.href = "/login";
    },
  };
}

// ---------------------------------------------------------------------------
const DEMO_KEY = "space-mais-demo-v1";

function demoAdapter() {
  const read = () => {
    try {
      const raw = localStorage.getItem(DEMO_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    const seed = demoSeed();
    write(seed);
    return seed;
  };
  const write = (db) => {
    try {
      localStorage.setItem(DEMO_KEY, JSON.stringify(db));
    } catch {}
  };
  const mutate = (fn) => {
    const db = read();
    fn(db);
    write(db);
  };
  const integrations = {};

  return {
    demo: true,
    async loadAll() {
      const db = read();
      return { data: db, me: { id: DEMO_USER_ID, email: "voce@contattos.com", isAdmin: true } };
    },
    async insert(table, row) {
      mutate((db) => db[TABLES[table]].push(row));
    },
    async update(table, id, patch) {
      mutate((db) => {
        db[TABLES[table]] = db[TABLES[table]].map((r) => (r.id === id ? { ...r, ...patch } : r));
      });
    },
    async remove(table, id) {
      mutate((db) => {
        db[TABLES[table]] = db[TABLES[table]].filter((r) => r.id !== id);
      });
    },
    subscribe() {
      return () => {};
    },
    async sendMessage(message) {
      mutate((db) => db.messages.push(message));
      return { forwarded: false };
    },
    async getIntegration(channelId) {
      return integrations[channelId] || { googleWebhookUrl: "", googleSpaceName: "", label: "" };
    },
    async saveIntegration(channelId, integration) {
      integrations[channelId] = integration;
      mutate((db) => {
        db.channels = db.channels.map((c) =>
          c.id === channelId ? { ...c, google_space_label: integration.label || "" } : c
        );
      });
      return { ok: true };
    },
    async signOut() {
      localStorage.removeItem(DEMO_KEY);
      window.location.reload();
    },
  };
}

export function nameFromEmail(email = "") {
  const base = email.split("@")[0].replace(/[._-]+/g, " ").replace(/\d+/g, "").trim();
  return base ? base.replace(/\b\w/g, (c) => c.toUpperCase()) : email;
}
