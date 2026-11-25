import "./globals.css";

export const metadata = {
  title: "space mais — Contattos+",
  description: "Rotina, projetos, atas e chat da equipe Contattos+ num lugar só.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
