"use client";

import { useEffect, useState } from "react";
import ClientPortal from "@/app/c/[token]/ClientPortal";
import Loading from "@/components/Loading";
import { buildDemoData } from "@/lib/demo-data";

// Portal do cliente em modo demonstração (cliente "Bella Doceria")
export default function DemoPortalPage() {
  const [data, setData] = useState(null);
  useEffect(() => {
    const d = buildDemoData();
    const client = d.clients[0];
    const posts = d.posts.filter((p) => p.client_id === client.id && p.status !== "draft");
    // Mais posts em aprovação para a demonstração ficar interessante
    posts.forEach((p) => { if (p.status === "approved") p.status = "in_review"; });
    setData({ client, agency: d.workspace.name, posts, comments: Object.values(d.comments).flat() });
  }, []);
  if (!data) return <Loading />;
  return <ClientPortal demo token="demo" client={data.client} agency={data.agency} initialPosts={data.posts} initialComments={data.comments} />;
}
