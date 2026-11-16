"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowUpDown, Clapperboard, Copy, Download, ExternalLink, ImageIcon, Instagram, Loader2, Printer, RefreshCw } from "lucide-react";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { Avatar } from "@/components/PostPreview";
import Loading from "@/components/Loading";
import LineChart from "@/components/reports/LineChart";
import StatTile from "@/components/reports/StatTile";
import BarList from "@/components/reports/BarList";
import { MAX_RANGE_DAYS, METRICS, PRESETS, buildDemoReport, formatNumber, formatPercent, isoDay, presetRange, shortDate } from "@/lib/reports";

const SORTS = [
  ["reach", "Alcance"],
  ["likes", "Curtidas"],
  ["comments", "Comentários"],
  ["saves", "Salvos"],
  ["shares", "Compart."],
  ["engagement", "Engaj."],
];

export default function ReportsPage() {
  const params = useSearchParams();
  const { loading: wsLoading, clients, accounts, clientById, href, demo } = useWorkspace();
  const [clientId, setClientId] = useState("");
  const [preset, setPreset] = useState(30);
  const [range, setRange] = useState(() => presetRange(30));
  const [report, setReport] = useState(null);
  const [state, setState] = useState("idle"); // idle | loading | error | not_connected | ready
  const [error, setError] = useState("");
  const [sort, setSort] = useState("reach");

  const connectedIds = useMemo(() => new Set(accounts.map((a) => a.client_id)), [accounts]);

  // Cliente inicial: ?client=… ou o primeiro com Instagram conectado
  useEffect(() => {
    if (wsLoading || clientId || !clients.length) return;
    const fromUrl = params.get("client");
    const first = clients.find((c) => connectedIds.has(c.id)) || clients[0];
    setClientId(fromUrl && clientById[fromUrl] ? fromUrl : first.id);
  }, [wsLoading, clients, clientId, params, connectedIds, clientById]);

  const load = useCallback(async () => {
    if (!clientId) return;
    setState("loading");
    setError("");
    if (demo) {
      await new Promise((r) => setTimeout(r, 250));
      setReport(buildDemoReport(clientId, range.since, range.until));
      return setState("ready");
    }
    const qs = new URLSearchParams({ client_id: clientId, since: range.since, until: range.until });
    try {
      const res = await fetch(`/api/reports/instagram?${qs}`);
      const json = await res.json();
      if (res.status === 409) return setState("not_connected");
      if (!res.ok) {
        setError(json.error || "Não foi possível carregar o relatório.");
        return setState("error");
      }
      setReport(json);
      setState("ready");
    } catch {
      setError("Falha de conexão. Tente de novo.");
      setState("error");
    }
  }, [clientId, range, demo]);

  useEffect(() => {
    load();
  }, [load]);

  function choosePreset(days) {
    setPreset(days);
    setRange(presetRange(days));
  }

  function setCustom(field, value) {
    if (!value) return;
    setPreset(null);
    setRange((r) => ({ ...r, [field]: value }));
  }

  const rangeDays = Math.round((new Date(range.until) - new Date(range.since)) / 86400000) + 1;
  const rangeInvalid = rangeDays < 1 || rangeDays > MAX_RANGE_DAYS;

  if (wsLoading) return <Loading />;
  const client = clientById[clientId];

  const posts = (report?.posts || [])
    .map((p) => ({ ...p, engagement: p.reach ? ((p.interactions ?? p.likes + p.comments) / p.reach) * 100 : null }))
    .sort((a, b) => (b[sort] ?? -1) - (a[sort] ?? -1));

  const t = report?.totals || {};
  const engagementRate = t.reach?.value ? ((t.total_interactions?.value ?? 0) / t.reach.value) * 100 : null;
  const prevEngagement = t.reach?.previous ? ((t.total_interactions?.previous ?? 0) / t.reach.previous) * 100 : null;
  const netFollowers = t.follows ? (t.follows.value || 0) - (t.unfollows?.value || 0) : null;

  function exportCsv() {
    const header = ["Data", "Tipo", "Legenda", "Alcance", "Visualizacoes", "Curtidas", "Comentarios", "Salvamentos", "Compartilhamentos", "Engajamento %", "Link"];
    const rows = posts.map((p) => [
      new Date(p.timestamp).toLocaleDateString("pt-BR"),
      p.type,
      `"${(p.caption || "").replace(/"/g, '""').replace(/\n/g, " ").slice(0, 200)}"`,
      p.reach ?? "",
      p.views ?? "",
      p.likes,
      p.comments,
      p.saves ?? "",
      p.shares ?? "",
      p.engagement !== null ? p.engagement.toFixed(2).replace(".", ",") : "",
      p.permalink || "",
    ]);
    const csv = "﻿" + [header, ...rows].map((r) => r.join(";")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = `relatorio-${(client?.name || "cliente").toLowerCase().replace(/\s+/g, "-")}-${range.since}-a-${range.until}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Relatórios do Instagram</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {client ? <>Desempenho de <b>{client.name}</b> de {shortDate(range.since)} a {shortDate(range.until)}.</> : "Escolha um cliente para ver os resultados."}
          </p>
        </div>
        {state === "ready" && (
          <div className="flex gap-2 print:hidden">
            <button onClick={exportCsv} className="btn-ghost"><Download size={16} /> CSV dos posts</button>
            <button onClick={() => window.print()} className="btn-dark"><Printer size={16} /> Salvar PDF</button>
          </div>
        )}
      </div>

      {/* Filtros: uma linha, acima de tudo que eles afetam */}
      <div className="card flex flex-wrap items-end gap-3 p-4 print:hidden">
        <div className="min-w-[200px] flex-1 sm:flex-none">
          <label className="label" htmlFor="rep-client">Cliente</label>
          <select id="rep-client" className="input" value={clientId} onChange={(e) => setClientId(e.target.value)}>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}{connectedIds.has(c.id) ? "" : " (não conectado)"}</option>
            ))}
          </select>
        </div>
        <div>
          <span className="label">Período</span>
          <div className="flex rounded-xl border border-line bg-white p-1 text-sm">
            {PRESETS.map((p) => (
              <button key={p.days} onClick={() => choosePreset(p.days)} className={`rounded-lg px-3 py-1.5 font-semibold transition ${preset === p.days ? "bg-navy text-white" : "text-ink-soft hover:text-ink"}`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-end gap-2">
          <div>
            <label className="label" htmlFor="rep-since">De</label>
            <input id="rep-since" type="date" className="input py-2" value={range.since} max={range.until} onChange={(e) => setCustom("since", e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="rep-until">Até</label>
            <input id="rep-until" type="date" className="input py-2" value={range.until} min={range.since} max={isoDay(new Date())} onChange={(e) => setCustom("until", e.target.value)} />
          </div>
        </div>
        <button onClick={load} className="btn-ghost px-3" aria-label="Atualizar" disabled={state === "loading" || rangeInvalid}>
          <RefreshCw size={16} className={state === "loading" ? "animate-spin" : ""} />
        </button>
        {rangeInvalid && <p className="w-full text-xs font-medium text-rose-600">Escolha um período de 1 a {MAX_RANGE_DAYS} dias.</p>}
      </div>

      {!clients.length && (
        <div className="card p-10 text-center">
          <h2 className="font-bold">Cadastre um cliente primeiro</h2>
          <Link href={href("/clientes")} className="btn-primary mt-4">Ir para Clientes</Link>
        </div>
      )}

      {state === "loading" && !report && (
        <div className="card flex items-center justify-center gap-2 p-16 text-sm text-ink-soft"><Loader2 size={18} className="animate-spin" /> Buscando dados no Instagram…</div>
      )}

      {state === "not_connected" && (
        <div className="card p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FEDA75] via-[#D62976] to-[#4F5BD5] text-white"><Instagram size={22} /></div>
          <h2 className="mt-4 text-lg font-bold">Instagram de {client?.name} não conectado</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-ink-soft">Conecte a conta profissional do cliente para ver alcance, curtidas e insights.</p>
          <Link href={href(`/clientes/${clientId}`)} className="btn-primary mt-5">Conectar Instagram</Link>
        </div>
      )}

      {state === "error" && (
        <div className="card flex gap-3 p-5 text-sm">
          <AlertTriangle size={20} className="shrink-0 text-rose-600" />
          <div>
            <div className="font-semibold">Não foi possível carregar o relatório</div>
            <p className="mt-1 text-ink-soft">{error}</p>
            <div className="mt-3 flex gap-2">
              <button onClick={load} className="btn-ghost px-3 py-1.5 text-xs">Tentar de novo</button>
              <Link href={href(`/clientes/${clientId}`)} className="btn-ghost px-3 py-1.5 text-xs">Reconectar Instagram</Link>
            </div>
          </div>
        </div>
      )}

      {report && (state === "ready" || state === "loading") && (
        <div className={`min-w-0 space-y-6 transition ${state === "loading" ? "opacity-50" : ""}`}>
          {/* Perfil */}
          <div className="card flex flex-wrap items-center gap-4 p-5">
            {report.account.picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={report.account.picture} alt="" className="h-14 w-14 rounded-full object-cover" />
            ) : (
              <Avatar client={client} size={56} />
            )}
            <div className="min-w-0 flex-1">
              <div className="text-lg font-bold">{client?.name}</div>
              <div className="text-sm text-ink-soft">@{report.account.username || client?.instagram_handle?.replace(/^@/, "") || "perfil"}</div>
            </div>
            {[
              ["Seguidores", report.account.followers],
              ["Seguindo", report.account.following],
              ["Publicações", report.account.mediaCount],
              ["Saldo de seguidores no período", netFollowers],
            ].map(([l, v]) => (
              <div key={l} className="min-w-[110px] border-line text-right sm:border-l sm:pl-5">
                <div className="text-xl font-bold">{l.startsWith("Saldo") && v > 0 ? "+" : ""}{formatNumber(v)}</div>
                <div className="text-xs text-ink-mute">{l}</div>
              </div>
            ))}
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {METRICS.slice(0, 3).map((m, i) => (
              <StatTile key={m.key} label={m.label} help={m.help} value={t[m.key]?.value ?? null} previous={t[m.key]?.previous ?? null} highlight={i === 0} />
            ))}
            <StatTile label="Taxa de engajamento" help="Interações ÷ alcance no período." value={engagementRate} previous={prevEngagement} percent />
            {METRICS.slice(3).map((m) => (
              <StatTile key={m.key} label={m.label} help={m.help} value={t[m.key]?.value ?? null} previous={t[m.key]?.previous ?? null} downIsGood={m.downIsGood} />
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <section className="card min-w-0 p-5">
              <h2 className="font-bold">Alcance por dia</h2>
              <p className="mb-4 text-xs text-ink-mute">Contas únicas alcançadas em cada dia. Passe o mouse para ver os valores.</p>
              <LineChart data={report.series.reach} label="Alcance" />
              <details className="mt-3 text-sm print:hidden">
                <summary className="cursor-pointer text-xs font-semibold text-brand">Ver dados em tabela</summary>
                <div className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-line">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-paper text-ink-mute"><tr><th className="px-3 py-2">Dia</th><th className="px-3 py-2 text-right">Alcance</th></tr></thead>
                    <tbody className="divide-y divide-line">
                      {report.series.reach.map((p) => (
                        <tr key={p.date}><td className="px-3 py-1.5">{new Date(`${p.date}T12:00:00`).toLocaleDateString("pt-BR")}</td><td className="px-3 py-1.5 text-right font-medium">{formatNumber(p.value, { compact: false })}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </section>
            <section className="card p-5">
              <h2 className="font-bold">Interações por tipo</h2>
              <p className="mb-5 text-xs text-ink-mute">Soma de todo o conteúdo no período.</p>
              <BarList
                items={[
                  { label: "Curtidas", value: t.likes?.value ?? 0 },
                  { label: "Salvamentos", value: t.saves?.value ?? 0 },
                  { label: "Compartilhamentos", value: t.shares?.value ?? 0 },
                  { label: "Comentários", value: t.comments?.value ?? 0 },
                ].sort((a, b) => b.value - a.value)}
              />
            </section>
          </div>

          {/* Posts */}
          <section className="card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 p-5 pb-3">
              <div>
                <h2 className="font-bold">Desempenho dos posts</h2>
                <p className="text-xs text-ink-mute">{posts.length} publicações no período (stories não entram).</p>
              </div>
              <div className="flex items-center gap-2 text-xs print:hidden">
                <ArrowUpDown size={14} className="text-ink-mute" />
                <select className="input w-auto py-1.5 text-xs" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Ordenar por">
                  {SORTS.map(([k, l]) => <option key={k} value={k}>Ordenar por {l.toLowerCase()}</option>)}
                </select>
              </div>
            </div>
            {posts.length === 0 ? (
              <div className="p-10 text-center text-sm text-ink-mute">Nenhuma publicação no período.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="border-y border-line bg-paper text-xs text-ink-mute">
                    <tr>
                      <th className="px-5 py-2.5 font-semibold">Post</th>
                      {SORTS.map(([k, l]) => (
                        <th key={k} className="px-3 py-2.5 text-right font-semibold">
                          <button onClick={() => setSort(k)} className={`inline-flex items-center gap-1 ${sort === k ? "text-brand" : ""}`}>{l}</button>
                        </th>
                      ))}
                      <th className="w-10 print:hidden" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {posts.map((p, i) => (
                      <tr key={p.id} className="hover:bg-paper/60">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <span className="w-5 text-xs font-bold text-ink-mute">{i + 1}</span>
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-paper">
                              {p.thumb ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={p.thumb} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <ImageIcon size={18} className="m-auto mt-3.5 text-ink-mute" />
                              )}
                              <span className="absolute right-0.5 top-0.5 text-white drop-shadow">
                                {p.type === "reels" || p.type === "video" ? <Clapperboard size={12} /> : p.type === "carousel" ? <Copy size={12} /> : null}
                              </span>
                            </div>
                            <div className="min-w-0 max-w-[260px]">
                              <div className="truncate font-medium">{p.caption || "Sem legenda"}</div>
                              <div className="text-xs text-ink-mute">{new Date(p.timestamp).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right font-semibold">{formatNumber(p.reach)}</td>
                        <td className="px-3 py-3 text-right">{formatNumber(p.likes)}</td>
                        <td className="px-3 py-3 text-right">{formatNumber(p.comments)}</td>
                        <td className="px-3 py-3 text-right">{formatNumber(p.saves)}</td>
                        <td className="px-3 py-3 text-right">{formatNumber(p.shares)}</td>
                        <td className="px-3 py-3 text-right">{formatPercent(p.engagement)}</td>
                        <td className="pr-4 print:hidden">
                          {p.permalink && (
                            <a href={p.permalink} target="_blank" rel="noreferrer" className="text-ink-mute hover:text-brand" aria-label="Abrir no Instagram"><ExternalLink size={15} /></a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <p className="text-xs text-ink-mute">
            Dados da API oficial do Instagram. As métricas podem levar até 48 h para se consolidar.
            {report.range.days > 30 && " Em períodos acima de 30 dias, o alcance total é a soma de blocos de 30 dias (uma mesma conta pode ser contada mais de uma vez)."}
            {report.unavailable?.length > 0 && ` Algumas métricas não estão disponíveis para esta conta: ${report.unavailable.join(", ")}.`}
          </p>
        </div>
      )}
    </div>
  );
}
