"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { statusAfterApproval } from "@/lib/posts";
import PostEditor from "./PostEditor";
import { resizeImage } from "@/lib/image";
import { demoPlanning, emptyMonthlyPlan, emptyStrategy } from "@/lib/planning";

const WorkspaceContext = createContext(null);

export function useWorkspace() {
  return useContext(WorkspaceContext);
}

const uid = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2));

// demo: objeto com dados fictícios → nada vai para o Supabase (modo demonstração /demo)
export default function WorkspaceProvider({ workspace, user, demo = null, children }) {
  const supabase = useMemo(() => (demo ? null : createClient()), [demo]);
  const [clients, setClients] = useState([]);
  const [posts, setPosts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [demoComments, setDemoComments] = useState(demo?.comments || {});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);
  const base = demo ? "/demo" : "";
  // Modo demonstração: planejamento guardado só na memória da página
  const demoStore = useRef(null);
  if (demo && !demoStore.current) {
    const seed = demoPlanning();
    demoStore.current = { strategy: { c1: seed.strategy }, plans: {}, notes: { c1: seed.notes } };
  }

  const notify = useCallback((message, kind = "ok") => {
    setToast({ message, kind });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const reload = useCallback(async () => {
    if (demo) {
      setClients(demo.clients);
      setPosts(demo.posts);
      setAccounts(demo.accounts);
      setLoading(false);
      return;
    }
    const [c, p, a] = await Promise.all([
      supabase.from("clients").select("*").eq("workspace_id", workspace.id).order("name"),
      supabase.from("posts").select("*").eq("workspace_id", workspace.id).order("scheduled_at", { ascending: true, nullsFirst: false }),
      supabase.from("social_accounts_public").select("*").eq("workspace_id", workspace.id),
    ]);
    if (c.error || p.error) notify((c.error || p.error).message, "error");
    setClients(c.data || []);
    setPosts(p.data || []);
    setAccounts(a.data || []);
    setLoading(false);
  }, [supabase, workspace.id, notify, demo]);

  useEffect(() => {
    reload();
  }, [reload]);

  const sortClients = (list) => [...list].sort((a, b) => a.name.localeCompare(b.name));

  // ── Clientes ───────────────────────────────────────────────
  const CLIENT_FIELDS = [
    "name", "instagram_handle", "color", "notes", "niche", "contact_name", "contact_phone", "contact_email", "document",
    "contract_status", "monthly_fee", "billing_day", "payment_method", "contract_start", "contract_end", "services", "contract_path",
  ];

  async function saveClient(client, { silent = false } = {}) {
    const payload = { workspace_id: workspace.id };
    for (const f of CLIENT_FIELDS) {
      if (!(f in client)) continue;
      const v = client[f];
      payload[f] = typeof v === "string" ? v.trim() || null : v ?? null;
    }
    payload.name = (client.name || "").trim();
    payload.services = client.services || [];
    payload.contract_status = client.contract_status || "active";
    let data;
    if (demo) {
      data = { ...client, ...payload, id: client.id || uid(), approval_token: client.approval_token || uid() };
    } else {
      const query = client.id
        ? supabase.from("clients").update(payload).eq("id", client.id).select().single()
        : supabase.from("clients").insert(payload).select().single();
      const res = await query;
      if (res.error) {
        notify(res.error.message, "error");
        return null;
      }
      data = res.data;
    }
    setClients((list) => sortClients([...list.filter((x) => x.id !== data.id), data]));
    if (!silent) notify(client.id ? "Cliente atualizado." : "Cliente criado.");
    return data;
  }

  // Contrato (PDF/imagem) no bucket privado "contracts"
  async function uploadContract(client, file) {
    const okType = ["application/pdf", "image/jpeg", "image/png"].includes(file.type);
    if (!okType) {
      notify("Envie o contrato em PDF, JPG ou PNG.", "error");
      return null;
    }
    if (file.size > 20 * 1024 * 1024) {
      notify("Arquivo muito grande (máx. 20 MB).", "error");
      return null;
    }
    if (demo) {
      const path = URL.createObjectURL(file);
      return saveClient({ ...client, contract_path: path }, { silent: true });
    }
    const ext = file.type === "application/pdf" ? "pdf" : file.type === "image/png" ? "png" : "jpg";
    const path = `${workspace.id}/${client.id}/contrato-${uid()}.${ext}`;
    const { error } = await supabase.storage.from("contracts").upload(path, file, { contentType: file.type });
    if (error) {
      notify(`Falha ao enviar o contrato: ${error.message}`, "error");
      return null;
    }
    const old = client.contract_path;
    const saved = await saveClient({ ...client, contract_path: path }, { silent: true });
    if (saved && old && !old.startsWith("blob:")) await supabase.storage.from("contracts").remove([old]);
    return saved;
  }

  async function removeContract(client) {
    if (!demo && client.contract_path) await supabase.storage.from("contracts").remove([client.contract_path]);
    return saveClient({ ...client, contract_path: null }, { silent: true });
  }

  // Link temporário (5 min) para abrir o contrato privado
  async function contractUrl(path) {
    if (!path) return null;
    if (demo || path.startsWith("blob:")) return path;
    const { data, error } = await supabase.storage.from("contracts").createSignedUrl(path, 300);
    if (error) {
      notify("Não foi possível abrir o contrato.", "error");
      return null;
    }
    return data.signedUrl;
  }

  async function deleteClient(id) {
    if (!demo) {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) return notify(error.message, "error");
    }
    setClients((list) => list.filter((x) => x.id !== id));
    setPosts((list) => list.filter((x) => x.client_id !== id));
    notify("Cliente removido.");
  }

  // Foto de perfil ou capa do cliente. kind: "avatar" | "cover"; file null = remover
  async function setClientImage(client, kind, file) {
    const column = kind === "avatar" ? "avatar_url" : "cover_url";
    let url = null;
    if (file) {
      if (!file.type.startsWith("image/")) {
        notify("Escolha um arquivo de imagem (JPG, PNG ou WebP).", "error");
        return null;
      }
      const resized = await resizeImage(file, kind === "avatar" ? 480 : 1800);
      if (resized.size > 8 * 1024 * 1024) {
        notify("Imagem muito grande (máx. 8 MB).", "error");
        return null;
      }
      if (demo) {
        url = URL.createObjectURL(resized);
      } else {
        const ext = resized.type === "image/png" ? "png" : resized.type === "image/webp" ? "webp" : "jpg";
        const path = `${workspace.id}/clients/${client.id}/${kind}-${uid()}.${ext}`;
        const { error } = await supabase.storage.from("media").upload(path, resized, { contentType: resized.type });
        if (error) {
          notify(`Falha no upload: ${error.message}`, "error");
          return null;
        }
        url = supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
      }
    }
    let updated = { ...client, [column]: url };
    if (!demo) {
      const res = await supabase.from("clients").update({ [column]: url }).eq("id", client.id).select().single();
      if (res.error) {
        notify(res.error.message, "error");
        return null;
      }
      updated = res.data;
    }
    setClients((list) => list.map((c) => (c.id === client.id ? updated : c)));
    notify(file ? (kind === "avatar" ? "Foto de perfil atualizada." : "Capa atualizada.") : kind === "avatar" ? "Foto removida." : "Capa removida.");
    return updated;
  }

  // ── Planejamento ───────────────────────────────────────────
  async function getStrategy(clientId) {
    if (demo) return { ...emptyStrategy(), ...(demoStore.current.strategy[clientId] || {}) };
    const { data, error } = await supabase.from("client_strategy").select("*").eq("client_id", clientId).maybeSingle();
    if (error) notify(error.message, "error");
    return { ...emptyStrategy(), ...(data || {}) };
  }

  async function saveStrategy(clientId, strategy) {
    const payload = {
      client_id: clientId,
      workspace_id: workspace.id,
      goals: strategy.goals || "",
      audience: strategy.audience || "",
      tone: strategy.tone || "",
      dos: strategy.dos || "",
      donts: strategy.donts || "",
      pillars: strategy.pillars || [],
      weekly_schedule: strategy.weekly_schedule || [],
      value_proposition: strategy.value_proposition || "",
      differentials: strategy.differentials || "",
      diagnosis: strategy.diagnosis || {},
      personas: strategy.personas || [],
      competitors: strategy.competitors || [],
      products: strategy.products || [],
    };
    if (demo) {
      demoStore.current.strategy[clientId] = payload;
      return payload;
    }
    const { data, error } = await supabase.from("client_strategy").upsert(payload, { onConflict: "client_id" }).select().single();
    if (error) {
      notify(error.message, "error");
      return null;
    }
    return data;
  }

  async function getMonthlyPlan(clientId, month) {
    if (demo) return { ...emptyMonthlyPlan(), ...(demoStore.current.plans[`${clientId}:${month}`] || {}) };
    const { data, error } = await supabase.from("client_monthly_plans").select("*").eq("client_id", clientId).eq("month", month).maybeSingle();
    if (error) notify(error.message, "error");
    return { ...emptyMonthlyPlan(), ...(data || {}) };
  }

  async function saveMonthlyPlan(clientId, month, plan) {
    const payload = {
      client_id: clientId,
      workspace_id: workspace.id,
      month,
      theme: plan.theme || "",
      goals: plan.goals || "",
      weeks: plan.weeks || [],
      key_dates: plan.key_dates || [],
    };
    if (demo) {
      demoStore.current.plans[`${clientId}:${month}`] = payload;
      return payload;
    }
    const { data, error } = await supabase.from("client_monthly_plans").upsert(payload, { onConflict: "client_id,month" }).select().single();
    if (error) {
      notify(error.message, "error");
      return null;
    }
    return data;
  }

  async function listNotes(clientId) {
    if (demo) return [...(demoStore.current.notes[clientId] || [])];
    const { data, error } = await supabase.from("client_notes").select("*").eq("client_id", clientId).order("created_at", { ascending: false });
    if (error) notify(error.message, "error");
    return data || [];
  }

  async function saveNote(clientId, note) {
    const payload = {
      client_id: clientId,
      workspace_id: workspace.id,
      kind: note.kind || "idea",
      title: note.title || "",
      body: note.body || "",
      link: note.link || null,
      pillar_id: note.pillar_id || null,
      status: note.status || "new",
      pinned: Boolean(note.pinned),
    };
    if (demo) {
      const list = demoStore.current.notes[clientId] || [];
      const saved = { ...note, ...payload, id: note.id || uid(), created_at: note.created_at || new Date().toISOString() };
      demoStore.current.notes[clientId] = [saved, ...list.filter((n) => n.id !== saved.id)];
      return saved;
    }
    if (!note.id) payload.created_by = user.id;
    const query = note.id
      ? supabase.from("client_notes").update(payload).eq("id", note.id).select().single()
      : supabase.from("client_notes").insert(payload).select().single();
    const { data, error } = await query;
    if (error) {
      notify(error.message, "error");
      return null;
    }
    return data;
  }

  async function deleteNote(clientId, id) {
    if (demo) {
      demoStore.current.notes[clientId] = (demoStore.current.notes[clientId] || []).filter((n) => n.id !== id);
      return true;
    }
    const { error } = await supabase.from("client_notes").delete().eq("id", id);
    if (error) {
      notify(error.message, "error");
      return false;
    }
    return true;
  }

  // Cria rascunhos em lote (ex.: a partir do cronograma semanal)
  async function createDraftPosts(drafts) {
    const rows = drafts.map((d) => ({
      workspace_id: workspace.id,
      client_id: d.client_id,
      title: d.title || "",
      caption: d.caption || "",
      format: d.format || "feed",
      networks: ["instagram"],
      tags: d.tags || [],
      media: [],
      status: "draft",
      scheduled_at: d.scheduled_at,
      ...(demo ? {} : { created_by: user.id }),
    }));
    let created;
    if (demo) {
      created = rows.map((r) => ({ ...r, id: uid() }));
    } else {
      const { data, error } = await supabase.from("posts").insert(rows).select();
      if (error) {
        notify(error.message, "error");
        return [];
      }
      created = data;
    }
    setPosts((list) => [...list, ...created]);
    return created;
  }

  // ── Posts ──────────────────────────────────────────────────
  async function savePost(post) {
    const payload = {
      workspace_id: workspace.id,
      client_id: post.client_id,
      title: post.title || "",
      caption: post.caption || "",
      format: post.format || "feed",
      networks: post.networks?.length ? post.networks : ["instagram"],
      tags: post.tags || [],
      media: post.media || [],
      status: post.status || "draft",
      scheduled_at: post.scheduled_at || null,
    };
    if (["approved", "scheduled"].includes(payload.status)) payload.status = statusAfterApproval(payload);

    let data;
    if (demo) {
      data = { ...post, ...payload, id: post.id || uid() };
    } else {
      if (!post.id) payload.created_by = user.id;
      const query = post.id
        ? supabase.from("posts").update(payload).eq("id", post.id).select().single()
        : supabase.from("posts").insert(payload).select().single();
      const res = await query;
      if (res.error) {
        notify(res.error.message, "error");
        return null;
      }
      data = res.data;
    }
    setPosts((list) => [...list.filter((x) => x.id !== data.id), data]);
    return data;
  }

  // Otimista: a tela muda na hora; se o banco recusar, volta ao estado anterior
  async function setPostStatus(post, status) {
    const patch = { status };
    if (status === "approved" || status === "scheduled") patch.status = statusAfterApproval(post);
    if (patch.status === "scheduled") patch.publish_error = null;
    const optimistic = { ...post, ...patch };
    setPosts((list) => list.map((x) => (x.id === post.id ? optimistic : x)));
    if (demo) return optimistic;
    const res = await supabase.from("posts").update(patch).eq("id", post.id).select().single();
    if (res.error) {
      setPosts((list) => list.map((x) => (x.id === post.id ? post : x)));
      notify(res.error.message, "error");
      return null;
    }
    setPosts((list) => list.map((x) => (x.id === res.data.id ? res.data : x)));
    return res.data;
  }

  async function deletePost(id) {
    const before = posts;
    setPosts((list) => list.filter((x) => x.id !== id));
    if (!demo) {
      const { error } = await supabase.from("posts").delete().eq("id", id);
      if (error) {
        setPosts(before);
        return notify(error.message, "error");
      }
    }
    notify("Post excluído.");
  }

  async function uploadMedia(file) {
    const type = file.type.startsWith("video") ? "video" : "image";
    if (demo) return { path: `demo/${uid()}`, url: URL.createObjectURL(file), type };
    const ext = (file.name.split(".").pop() || "bin").toLowerCase();
    const path = `${workspace.id}/${uid()}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, file, { contentType: file.type });
    if (error) {
      notify(`Falha no upload: ${error.message}`, "error");
      return null;
    }
    const { data } = supabase.storage.from("media").getPublicUrl(path);
    return { path, url: data.publicUrl, type };
  }

  async function listComments(postId) {
    if (demo) return demoComments[postId] || [];
    const { data } = await supabase.from("post_comments").select("*").eq("post_id", postId).order("created_at");
    return data || [];
  }

  async function addComment(postId, body) {
    if (demo) {
      const c = { id: uid(), post_id: postId, author_type: "team", author_name: user.email, body, created_at: new Date().toISOString() };
      setDemoComments((m) => ({ ...m, [postId]: [...(m[postId] || []), c] }));
      return c;
    }
    const { data, error } = await supabase
      .from("post_comments")
      .insert({ post_id: postId, workspace_id: workspace.id, author_type: "team", author_name: user.email, body })
      .select()
      .single();
    if (error) notify(error.message, "error");
    return data;
  }

  const clientById = useMemo(() => Object.fromEntries(clients.map((c) => [c.id, c])), [clients]);

  const value = {
    workspace,
    user,
    supabase,
    demo: Boolean(demo),
    href: (path) => `${base}${path === "/" && base ? "" : path}`,
    loading,
    clients,
    clientById,
    posts,
    accounts,
    reload,
    notify,
    saveClient,
    deleteClient,
    setClientImage,
    uploadContract,
    removeContract,
    contractUrl,
    getStrategy,
    saveStrategy,
    getMonthlyPlan,
    saveMonthlyPlan,
    listNotes,
    saveNote,
    deleteNote,
    createDraftPosts,
    savePost,
    setPostStatus,
    deletePost,
    uploadMedia,
    listComments,
    addComment,
    openEditor: (post) => setEditing(post || {}),
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
      {editing && <PostEditor initial={editing} onClose={() => setEditing(null)} />}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[60] rounded-xl px-4 py-3 text-sm font-medium text-white shadow-float ${
            toast.kind === "error" ? "bg-rose-600" : "bg-navy"
          }`}
        >
          {toast.message}
        </div>
      )}
    </WorkspaceContext.Provider>
  );
}
