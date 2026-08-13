import "./globals.css";

export const metadata = {
  title: "Marketing OS — Contattos+",
  description:
    "Sistema operacional de marketing para gestão de projetos, campanhas, demandas, verba cooperada e equipe.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
