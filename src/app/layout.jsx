import "./globals.css";

export const metadata = {
  title: "SpaceMais — Gestão de projetos",
  description: "Rotina, projetos, atas e integração entre setores num lugar só. Simples de adotar, feito para equipes brasileiras.",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@300;400;600;700;800&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
