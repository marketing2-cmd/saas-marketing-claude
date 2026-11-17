"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatNumber, shortDate } from "@/lib/reports";

const SERIES = "#1E4FD8"; // tom de cobalto validado para dados (o #082B87 é escuro demais)
const GRID = "#ECEAF4";
const PAD = { top: 16, right: 16, bottom: 28, left: 48 };

function niceMax(v) {
  if (v <= 0) return 10;
  const exp = Math.pow(10, Math.floor(Math.log10(v)));
  const f = v / exp;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return nice * exp;
}

// Gráfico de linha de uma série (alcance por dia): linha 2px, área 10%,
// crosshair que encaixa no dia mais próximo + tooltip; navegável por teclado.
export default function LineChart({ data, label = "Valor", height = 260 }) {
  const wrap = useRef(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState(null);

  useEffect(() => {
    if (!wrap.current) return;
    setWidth(Math.max(280, Math.round(wrap.current.clientWidth)));
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(wrap.current);
    return () => ro.disconnect();
  }, []);

  const geo = useMemo(() => {
    const innerW = width - PAD.left - PAD.right;
    const innerH = height - PAD.top - PAD.bottom;
    const max = niceMax(Math.max(...data.map((d) => d.value), 0) * 1.08);
    const x = (i) => PAD.left + (data.length <= 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
    const y = (v) => PAD.top + innerH - (v / max) * innerH;
    const line = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(" ");
    const area = data.length ? `${line} L${x(data.length - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z` : "";
    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
    const step = Math.max(1, Math.ceil(data.length / Math.max(2, Math.floor(innerW / 90))));
    const xTicks = data.map((d, i) => i).filter((i) => i % step === 0);
    return { x, y, line, area, yTicks, xTicks, innerW };
  }, [data, width, height]);

  function onMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left - PAD.left;
    const i = Math.round((px / geo.innerW) * (data.length - 1));
    setActive(Math.min(data.length - 1, Math.max(0, i)));
  }

  function onKey(e) {
    if (e.key === "ArrowRight") setActive((i) => Math.min(data.length - 1, (i ?? -1) + 1));
    else if (e.key === "ArrowLeft") setActive((i) => Math.max(0, (i ?? data.length) - 1));
    else return;
    e.preventDefault();
  }

  const point = active !== null ? data[active] : null;
  const tipLeft = point ? Math.min(Math.max(geo.x(active), 70), width - 70) : 0;

  // O wrapper é sempre o mesmo elemento, para o ResizeObserver medir a largura real
  return (
    <div ref={wrap} className="relative w-full min-w-0 overflow-hidden select-none" style={{ minHeight: data.length ? height : 200 }}>
      {!data.length ? (
        <div className="flex h-[200px] items-center justify-center text-sm text-ink-mute">Sem dados no período.</div>
      ) : !width ? null : (
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={`${label} por dia. Use as setas para navegar.`}
        tabIndex={0}
        onKeyDown={onKey}
        onPointerMove={onMove}
        onPointerLeave={() => setActive(null)}
        onBlur={() => setActive(null)}
        className="block outline-none focus-visible:ring-2 focus-visible:ring-brand-ring focus-visible:rounded-xl"
      >
        {geo.yTicks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={width - PAD.right} y1={geo.y(t)} y2={geo.y(t)} stroke={GRID} strokeWidth="1" />
            <text x={PAD.left - 8} y={geo.y(t)} dy="0.32em" textAnchor="end" className="fill-ink-mute text-[11px]">
              {formatNumber(Math.round(t))}
            </text>
          </g>
        ))}
        {geo.xTicks.map((i) => (
          <text key={i} x={geo.x(i)} y={height - 8} textAnchor="middle" className="fill-ink-mute text-[11px]">
            {shortDate(data[i].date)}
          </text>
        ))}
        <path d={geo.area} fill={SERIES} fillOpacity="0.1" />
        <path d={geo.line} fill="none" stroke={SERIES} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {point && (
          <g>
            <line x1={geo.x(active)} x2={geo.x(active)} y1={PAD.top} y2={height - PAD.bottom} stroke="#C9C6D9" strokeWidth="1" />
            <circle cx={geo.x(active)} cy={geo.y(point.value)} r="6" fill="#fff" />
            <circle cx={geo.x(active)} cy={geo.y(point.value)} r="4" fill={SERIES} />
          </g>
        )}
      </svg>
      )}
      {point && width > 0 && (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-xl bg-navy px-3 py-2 text-xs text-white shadow-float"
          style={{ left: tipLeft }}
        >
          <div className="font-semibold">{new Date(`${point.date}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })}</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-white/80">
            <span className="h-2 w-2 rounded-full" style={{ background: SERIES }} />
            {label}: <b className="text-white">{formatNumber(point.value, { compact: false })}</b>
          </div>
        </div>
      )}
    </div>
  );
}
