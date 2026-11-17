import { clientGradient } from "@/lib/posts";

// Capa do cliente: imagem enviada ou, se não houver, o degradê da cor dele
export default function ClientCover({ client, className = "", children }) {
  return (
    <div className={`relative overflow-hidden ${className}`} style={client?.cover_url ? undefined : { background: clientGradient(client?.color) }}>
      {client?.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={client.cover_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(255,255,255,.7),transparent_45%)]" />
      )}
      {children}
    </div>
  );
}
