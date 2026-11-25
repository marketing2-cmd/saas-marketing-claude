import MarketingOS from "@/components/MarketingOS";

export const metadata = { title: "Marketing OS — Contattos+" };

export default function MarketingOSPage() {
  return (
    <main style={{ padding: 24, minHeight: "100vh", background: "#f5f6f3", color: "#0A0E1A", colorScheme: "light" }}>
      <a href="/app" style={{ display: "inline-block", marginBottom: 12, fontSize: 13, color: "#0038FF", fontWeight: 600 }}>
        ← Voltar ao SpaceMais
      </a>
      <MarketingOS />
    </main>
  );
}
