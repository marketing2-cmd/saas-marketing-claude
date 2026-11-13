"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { statusAfterApproval } from "@/lib/posts";
import PostEditor from "./PostEditor";

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
  async function saveClient(client) {
    const payload = {
      name: client.name,
      instagram_handle: client.instagram_handle || null,
      color: client.color,
      notes: client.notes || null,
      workspace_id: workspace.id,
    };
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
    notify(client.id ? "Cliente atualizado." : "Cliente criado.");
    return data;
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

  async function setPostStatus(post, status) {
    const patch = { status };
    if (status === "approved" || status === "scheduled") patch.status = statusAfterApproval(post);
    if (patch.status === "scheduled") patch.publish_error = null;
    let data;
    if (demo) {
      data = { ...post, ...patch };
    } else {
      const res = await supabase.from("posts").update(patch).eq("id", post.id).select().single();
      if (res.error) return notify(res.error.message, "error");
      data = res.data;
    }
    setPosts((list) => list.map((x) => (x.id === data.id ? data : x)));
    return data;
  }

  async function deletePost(id) {
    if (!demo) {
      const { error } = await supabase.from("posts").delete().eq("id", id);
      if (error) return notify(error.message, "error");
    }
    setPosts((list) => list.filter((x) => x.id !== id));
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
