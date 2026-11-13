import { notFound } from "next/navigation";
import { loadPortal } from "@/lib/portal";
import ClientPortal from "./ClientPortal";

export const dynamic = "force-dynamic";
export const metadata = { title: "Aprovação de conteúdo", robots: { index: false } };

export default async function PortalPage({ params }) {
  const data = await loadPortal(params.token);
  if (!data) notFound();
  const { client, posts, comments } = data;
  return (
    <ClientPortal
      token={params.token}
      client={{ name: client.name, instagram_handle: client.instagram_handle, color: client.color }}
      agency={client.workspaces?.name}
      initialPosts={posts}
      initialComments={comments}
    />
  );
}
