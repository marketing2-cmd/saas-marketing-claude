import MarketingOS from "@/components/MarketingOS";

export const metadata = { title: "Marketing OS — Contattos+" };

export default function MarketingOSPage() {
  return (
    <main style={{ padding: 24 }}>
      <a href="/" style={{ display: "inline-block", marginBottom: 12, fontSize: 13, color: "#0038FF", fontWeight: 600 }}>
        ← Voltar ao space mais
      </a>
      <MarketingOS />
    </main>
  );
}
