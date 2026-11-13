import "./globals.css";

export const metadata = {
  title: "SaaS Social Media",
  description: "Aprovação de conteúdo, calendário e agendamento automático para social medias e agências.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
