/* Verbas Contattos+ — adaptador para rodar fora do Claude.
 *
 * A página (artifacts/verbas/verbas.html) foi escrita para o runtime de artefatos do
 * Claude, que oferece window.claude.use("db") e window.claude.use("user"). Este arquivo
 * implementa essas mesmas duas interfaces em cima da rota /api/verbas (Supabase), para
 * que a página rode igual no app do Vercel. Atualiza os dados a cada 15 s e logo após
 * cada gravação. */
(function () {
  "use strict";
  const POLL_MS = 15000;
  const st = { docs: {}, me: null, people: [], loaded: false, listeners: new Set(), timer: null };

  const clone = (o) => JSON.parse(JSON.stringify(o));
  const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
  function deepMerge(base, patch) {
    const out = { ...(isObj(base) ? base : {}) };
    for (const [k, v] of Object.entries(patch)) out[k] = isObj(v) && isObj(out[k]) ? deepMerge(out[k], v) : v;
    return out;
  }
  function newId() {
    const a = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let s = ""; const r = crypto.getRandomValues(new Uint8Array(20));
    for (const b of r) s += a[b % a.length];
    return s;
  }

  async function refresh() {
    try {
      const r = await fetch("/api/verbas", { cache: "no-store", credentials: "same-origin" });
      if (r.status === 401) { location.href = "/login"; return; }
      if (r.status === 403) { location.href = "/pending"; return; }
      if (!r.ok) return;
      const txt = await r.text();
      if (st.loaded && txt === st.lastTxt) return; // nada mudou: não redesenha a tela
      st.lastTxt = txt;
      const j = JSON.parse(txt);
      const docs = {};
      for (const d of j.docs) (docs[d.collection] ||= {})[d.id] = d.data;
      st.docs = docs; st.me = j.me; st.people = j.people || []; st.loaded = true;
      notify();
    } catch (e) { /* sem rede: tenta de novo no próximo ciclo */ }
  }
  function notify() { for (const l of st.listeners) { try { l(); } catch (e) { console.error(e); } } }
  function schedule() {
    clearInterval(st.timer);
    st.timer = setInterval(() => { if (document.visibilityState === "visible") refresh(); }, POLL_MS);
  }
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") refresh(); });

  async function write(op, collection, id, data) {
    const coll = (st.docs[collection] ||= {});
    const before = coll[id];
    if (op === "set") coll[id] = clone(data);
    else if (op === "update") { if (!before) throw { code: "invalid_argument", message: "Documento não encontrado." }; coll[id] = deepMerge(before, clone(data)); }
    else delete coll[id];
    notify();
    let r;
    try {
      r = await fetch("/api/verbas", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ op, collection, id, data }) });
    } catch (e) { refresh(); throw { code: "unavailable", message: "Sem conexão." }; }
    if (!r.ok) {
      refresh();
      const code = r.status === 403 || r.status === 400 || r.status === 404 ? "invalid_argument" : r.status === 413 ? "invalid_argument" : "unavailable";
      throw { code, message: "Falha ao salvar (" + r.status + ")." };
    }
    refresh();
  }

  function snapDoc(id, data) {
    return { id, exists: data !== undefined, data: () => (data === undefined ? undefined : data), metadata: { fromCache: false, hasPendingWrites: false } };
  }
  function cmp(a, op, b) {
    switch (op) {
      case "==": return a === b; case "!=": return a !== b; case "<": return a < b; case "<=": return a <= b;
      case ">": return a > b; case ">=": return a >= b; case "in": return Array.isArray(b) && b.includes(a);
      case "not-in": return Array.isArray(b) && !b.includes(a); case "array-contains": return Array.isArray(a) && a.includes(b);
      default: return false;
    }
  }
  function makeQuery(collection, wheres, order, lim) {
    const run = () => {
      let rows = Object.entries(st.docs[collection] || {}).filter(([, d]) => wheres.every(([f, op, v]) => cmp(d[f], op, v)));
      if (order) {
        const [f, dir] = order;
        rows.sort((x, y) => { const a = x[1][f], b = y[1][f]; if (a === undefined) return 1; if (b === undefined) return -1; return (a < b ? -1 : a > b ? 1 : 0) * (dir === "desc" ? -1 : 1); });
      } else rows.sort((x, y) => (x[0] < y[0] ? -1 : 1));
      if (lim) rows = rows.slice(0, lim);
      const docs = rows.map(([id, d]) => snapDoc(id, d));
      return { docs, size: docs.length, empty: !docs.length, docChanges: () => [], metadata: { fromCache: false, hasPendingWrites: false } };
    };
    return {
      where: (f, op, v) => makeQuery(collection, [...wheres, [f, op, v]], order, lim),
      orderBy: (f, dir = "asc") => makeQuery(collection, wheres, [f, dir], lim),
      limit: (n) => makeQuery(collection, wheres, order, n),
      get: async () => { if (!st.loaded) await refresh(); return run(); },
      onSnapshot(next) {
        const l = () => { if (st.loaded) next(run()); };
        st.listeners.add(l); if (st.loaded) setTimeout(l, 0);
        return () => st.listeners.delete(l);
      },
    };
  }
  function docRef(collection, id) {
    return {
      id, path: collection + "/" + id,
      get: async () => { if (!st.loaded) await refresh(); return snapDoc(id, (st.docs[collection] || {})[id]); },
      set: (data) => write("set", collection, id, data),
      update: (data) => write("update", collection, id, data),
      delete: () => write("delete", collection, id),
      onSnapshot(next) {
        const l = () => { if (st.loaded) next(snapDoc(id, (st.docs[collection] || {})[id])); };
        st.listeners.add(l); if (st.loaded) setTimeout(l, 0);
        return () => st.listeners.delete(l);
      },
    };
  }
  function collRef(collection) {
    return Object.assign(makeQuery(collection, [], null, null), {
      path: collection,
      doc: (id) => docRef(collection, id || newId()),
      add: async (data) => { const ref = docRef(collection, newId()); await ref.set(data); return ref; },
    });
  }
  const db = {
    collection: (p) => { if (p.includes("/")) throw new TypeError("Caminho de coleção não suportado: " + p); return collRef(p); },
    doc: (p) => { const s = p.split("/"); if (s.length !== 2) throw new TypeError("Caminho de documento não suportado: " + p); return docRef(s[0], s[1]); },
  };

  /* pessoas: nome a partir do e-mail, avatar com iniciais */
  function nomeDe(email) {
    if (!email) return "";
    return email.split("@")[0].split(/[._-]+/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
  }
  function corDe(id) { let h = 0; for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return "hsl(" + (h % 360) + " 55% 45%)"; }
  function avatarDe(id, name) {
    const ini = (name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="32" fill="${corDe(id)}"/><text x="32" y="41" font-family="Arial,sans-serif" font-size="24" font-weight="700" fill="#fff" text-anchor="middle">${ini.replace(/[<>&]/g, "")}</text></svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }
  function profile(id) {
    const p = st.people.find((x) => x.id === id);
    const name = p ? nomeDe(p.email) : "";
    return { id, name, email: p ? p.email : null, avatarUrl: avatarDe(id, name), color: corDe(id), isMe: !!st.me && st.me.id === id, guest: false };
  }
  const user = {
    async me() { if (!st.loaded) await refresh(); const p = profile(st.me ? st.me.id : ""); return { ...p, id: st.me ? st.me.id : null, isOwner: !!(st.me && st.me.isAdmin), canEdit: !!(st.me && st.me.isAdmin) }; },
    async id() { if (!st.loaded) await refresh(); return st.me ? st.me.id : null; },
    async isOwner() { if (!st.loaded) await refresh(); return !!(st.me && st.me.isAdmin); },
    async canEdit() { return this.isOwner(); },
    async can(name) { return name === "data.write" ? true : false; },
    async name() { const m = await this.me(); return m.name; },
    async profiles(ids) { if (!st.loaded) await refresh(); const out = {}; for (const id of [].concat(ids)) out[id] = profile(id); return out; },
    async search(q) {
      if (!st.loaded) await refresh();
      q = String(q || "").toLowerCase();
      return st.people.filter((p) => !q || p.email.toLowerCase().includes(q) || nomeDe(p.email).toLowerCase().includes(q)).slice(0, 8).map((p) => profile(p.id));
    },
  };

  window.claude = { use: async (name) => (name === "db" ? db : name === "user" ? user : null) };
  refresh(); schedule();
})();
