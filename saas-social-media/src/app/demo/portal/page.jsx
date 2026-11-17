"use client";

import { useEffect, useState } from "react";
import ClientPortal from "@/app/c/[token]/ClientPortal";
import Loading from "@/components/Loading";
import { buildDemoData } from "@/lib/demo-data";
import { demoPlanning } from "@/lib/planning";
import { CLIENT_VISIBLE_STAGE, getStages, sanitizeForClient } from "@/lib/posts";

// Portal do cliente em modo demonstração (cliente "Bella Doceria")
export default function DemoPortalPage() {
  const [data, setData] = useState(null);
  useEffect(() => {
    const d = buildDemoData();
    const client = d.clients[0];
    // Mais posts em aprovação para a demonstração ficar interessante
    d.posts.forEach((p) => { if (p.status === "approved") p.status = "in_review"; });
    const posts = d.posts
      .filter((p) => p.client_id === client.id && Object.values(getStages(p)).some((s) => CLIENT_VISIBLE_STAGE.has(s)))
      .map(sanitizeForClient);
    const st = demoPlanning().strategy;
    const shared = {
      diagnosis: st.diagnosis,
      personas: st.personas,
      competitors: st.competitors,
      positioning: { ...st },
      products: st.products,
      schedule: { weekly: st.weekly_schedule, pillars: st.pillars, monthly: [] },
    };
    setData({ client, agency: d.workspace.name, posts, comments: Object.values(d.comments).flat(), shared });
  }, []);
  if (!data) return <Loading />;
  return <ClientPortal demo token="demo" client={data.client} agency={data.agency} initialPosts={data.posts} initialComments={data.comments} shared={data.shared} />;
}
