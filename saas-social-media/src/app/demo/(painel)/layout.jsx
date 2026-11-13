"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import Loading from "@/components/Loading";
import { buildDemoData } from "@/lib/demo-data";

// Modo demonstração: mesmo painel, com dados fictícios e sem login.
// Os dados são montados só no navegador (datas relativas a "hoje" no fuso do visitante).
export default function DemoLayout({ children }) {
  const [demo, setDemo] = useState(null);
  useEffect(() => setDemo(buildDemoData()), []);
  if (!demo) return <Loading />;
  return (
    <AppShell user={demo.user} workspace={demo.workspace} demo={demo}>
      {children}
    </AppShell>
  );
}
