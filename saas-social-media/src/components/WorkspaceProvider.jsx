"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { statusAfterApproval } from "@/lib/posts";
import PostEditor from "./PostEditor";

const WorkspaceContext = createContext(null);

export function useWorkspace() {
  return useContext(WorkspaceContext);
}

export default function WorkspaceProvider({ workspace, user, children }) {
  const supabase = useMemo(() => createClient(), []);
  const [clients, setClients] = useState([]);
  const [posts, setPosts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);

  const notify = useCallback((message, kind = "ok") => {
    setToast({ message, kind });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const reload = useCallback(async () => {
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
  }, [supabase, workspace.id, notify]);

  useEffect(() => {
    reload();
  }, [reload]);

  // ── Clientes ───────────────────────────────────────────────
  async function saveClient(client) {
    const payload = {
      name: client.name,
      instagram_handle: client.instagram_handle || null,
      color: client.color,
      notes: client.notes || null,
      workspace_id: workspace.id,
    };
    const query = client.id
      ? supabase.from("clients").update(payload).eq("id", client.id).select().single()
      : supabase.from("clients").insert(payload).select().single();
    const { data, error } = await query;
    if (error) {
      notify(error.message, "error");
      return null;
    }
    setClients((list) => [...list.filter((x) => x.id !== data.id), data].sort((a, b) => a.name.localeCompare(b.name)));
    notify(client.id ? "Cliente atualizado." : "Cliente criado.");
    return data;
  }

  async function deleteClient(id) {
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) return notify(error.message, "error");
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
    // Mudou a data de um post aprovado/agendado → recalcula o status
    if (["approved", "scheduled"].includes(payload.status)) payload.status = statusAfterApproval(payload);
    if (!post.id) payload.created_by = user.id;

    const query = post.id
      ? supabase.from("posts").update(payload).eq("id", post.id).select().single()
      : supabase.from("posts").insert(payload).select().single();
    const { data, error } = await query;
    if (error) {
      notify(error.message, "error");
      return null;
    }
    setPosts((list) => [...list.filter((x) => x.id !== data.id), data]);
    return data;
  }

  async function setPostStatus(post, status) {
    const patch = { status };
    if (status === "approved" || status === "scheduled") patch.status = statusAfterApproval(post);
    if (patch.status === "scheduled") patch.publish_error = null;
    const { data, error } = await supabase.from("posts").update(patch).eq("id", post.id).select().single();
    if (error) return notify(error.message, "error");
    setPosts((list) => list.map((x) => (x.id === data.id ? data : x)));
    return data;
  }

  async function deletePost(id) {
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) return notify(error.message, "error");
    setPosts((list) => list.filter((x) => x.id !== id));
    notify("Post excluído.");
  }

  async function uploadMedia(file) {
    const ext = (file.name.split(".").pop() || "bin").toLowerCase();
    const path = `${workspace.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, file, { contentType: file.type });
    if (error) {
      notify(`Falha no upload: ${error.message}`, "error");
      return null;
    }
    const { data } = supabase.storage.from("media").getPublicUrl(path);
    return { path, url: data.publicUrl, type: file.type.startsWith("video") ? "video" : "image" };
  }

  async function listComments(postId) {
    const { data } = await supabase.from("post_comments").select("*").eq("post_id", postId).order("created_at");
    return data || [];
  }

  async function addComment(postId, body) {
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
          className={`fixed bottom-6 right-6 z-[60] rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${
            toast.kind === "error" ? "bg-rose-600" : "bg-ink"
          }`}
        >
          {toast.message}
        </div>
      )}
    </WorkspaceContext.Provider>
  );
}
