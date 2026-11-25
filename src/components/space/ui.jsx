"use client";

import { useEffect, useRef, useState } from "react";
import { X, Check, ChevronDown, UserRound, CalendarDays } from "lucide-react";
import { useSpace } from "./store";
import { STATUSES, PRIORITIES, statusOf, priorityOf, initials, colorFor, formatDue, daysFromToday } from "@/lib/space/model";

export const cx = (...c) => c.filter(Boolean).join(" ");

export function Button({ variant = "primary", size = "md", className, ...props }) {
  const base = "inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition disabled:opacity-50";
  const sizes = { sm: "h-8 px-3 text-[13px]", md: "h-9 px-3.5 text-sm" };
  const variants = {
    primary: "bg-brand text-white hover:bg-brand-dark",
    ghost: "text-ink-2 hover:bg-hover",
    outline: "border border-line bg-white text-ink hover:bg-hover",
    danger: "text-red-600 hover:bg-red-50",
  };
  return <button className={cx(base, sizes[size], variants[variant], className)} {...props} />;
}

export function Avatar({ member, size = 26 }) {
  if (!member)
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center rounded-full border border-dashed border-line text-muted"
        style={{ width: size, height: size }}
      >
        <UserRound size={size * 0.55} />
      </span>
    );
  return (
    <span
      title={member.name}
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, background: colorFor(member.id), fontSize: size * 0.4 }}
    >
      {initials(member.name)}
    </span>
  );
}

export function SectorDot({ sector, size = 8 }) {
  return <span className="inline-block shrink-0 rounded-full" style={{ width: size, height: size, background: sector?.color || "#A9AEBB" }} />;
}

// Popover simples com fechamento por clique fora / Esc.
export function Popover({ trigger, children, align = "left", width = 220 }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div className="relative" ref={ref}>
      <div onClick={(e) => (e.stopPropagation(), setOpen((o) => !o))}>{trigger}</div>
      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={cx("absolute z-40 mt-1 rounded-xl border border-line bg-white p-1 shadow-pop", align === "right" ? "right-0" : "left-0")}
          style={{ width }}
        >
          {typeof children === "function" ? children(() => setOpen(false)) : children}
        </div>
      )}
    </div>
  );
}

export function MenuItem({ active, onClick, children }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm text-ink hover:bg-hover">
      <span className="flex flex-1 items-center gap-2 truncate">{children}</span>
      {active && <Check size={14} className="text-brand" />}
    </button>
  );
}

// Célula colorida estilo monday (status / prioridade)
export function StatusPill({ value, onChange, kind = "status", block = false }) {
  const opts = kind === "status" ? STATUSES : PRIORITIES;
  const cur = kind === "status" ? statusOf(value) : priorityOf(value);
  const pill = (
    <span
      className={cx(
        "inline-flex cursor-pointer select-none items-center justify-center whitespace-nowrap text-[12.5px] font-semibold text-white",
        block ? "h-full w-full min-h-[36px] px-2" : "h-6 rounded-md px-2.5"
      )}
      style={{ background: cur.color }}
    >
      {cur.label}
    </span>
  );
  if (!onChange) return pill;
  return (
    <Popover trigger={pill} width={180}>
      {(close) =>
        opts.map((o) => (
          <button
            key={o.id}
            onClick={() => (onChange(o.id), close())}
            className="mb-0.5 flex h-8 w-full items-center justify-center rounded-md text-[13px] font-semibold text-white hover:opacity-90"
            style={{ background: o.color }}
          >
            {o.label}
          </button>
        ))
      }
    </Popover>
  );
}

export function MemberPicker({ value, onChange, size = 26, withName = false, placeholder = "Ninguém" }) {
  const { data } = useSpace();
  const [q, setQ] = useState("");
  const cur = data.members.find((m) => m.id === value);
  const list = data.members.filter((m) => m.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <Popover
      width={240}
      trigger={
        <button className="flex items-center gap-2 rounded-lg px-1 py-0.5 hover:bg-hover">
          <Avatar member={cur} size={size} />
          {withName && <span className={cx("text-sm", cur ? "text-ink" : "text-muted")}>{cur?.name || placeholder}</span>}
        </button>
      }
    >
      {(close) => (
        <>
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar pessoa…"
            className="mb-1 w-full rounded-lg border border-line px-2.5 py-1.5 text-sm outline-none focus:border-brand"
          />
          <div className="max-h-60 overflow-auto">
            <MenuItem active={!value} onClick={() => (onChange(null), close())}>
              <Avatar member={null} size={22} /> <span className="text-muted">Ninguém</span>
            </MenuItem>
            {list.map((m) => (
              <MenuItem key={m.id} active={m.id === value} onClick={() => (onChange(m.id), close())}>
                <Avatar member={m} size={22} /> {m.name}
              </MenuItem>
            ))}
          </div>
        </>
      )}
    </Popover>
  );
}

export function SectorPicker({ value, onChange, placeholder = "Escolher setor", allowNone = false }) {
  const { data } = useSpace();
  const cur = data.sectors.find((s) => s.id === value);
  return (
    <Popover
      trigger={
        <button className="flex items-center gap-2 rounded-lg px-1.5 py-1 text-sm hover:bg-hover">
          {cur ? <SectorDot sector={cur} /> : null}
          <span className={cur ? "text-ink" : "text-muted"}>{cur?.name || placeholder}</span>
          <ChevronDown size={14} className="text-muted" />
        </button>
      }
    >
      {(close) => (
        <>
          {allowNone && (
            <MenuItem active={!value} onClick={() => (onChange(null), close())}>
              <span className="text-muted">Nenhum</span>
            </MenuItem>
          )}
          {[...data.sectors]
            .sort((a, b) => a.position - b.position)
            .map((s) => (
              <MenuItem key={s.id} active={s.id === value} onClick={() => (onChange(s.id), close())}>
                <SectorDot sector={s} /> {s.name}
              </MenuItem>
            ))}
        </>
      )}
    </Popover>
  );
}

export function DueDate({ value, onChange, done }) {
  const diff = value ? daysFromToday(value) : null;
  const tone = !value || done ? "text-ink-2" : diff < 0 ? "text-red-600 font-semibold" : diff === 0 ? "text-amber-600 font-semibold" : "text-ink-2";
  const label = value ? formatDue(value) : "";
  const inner = (
    <span className={cx("inline-flex items-center gap-1.5 text-[13px]", tone)}>
      {!value && <CalendarDays size={15} className="text-muted" />}
      {label}
    </span>
  );
  if (!onChange) return inner;
  return (
    <label className="relative inline-flex cursor-pointer items-center rounded-md px-1 py-0.5 hover:bg-hover">
      {inner}
      <input
        type="date"
        value={value || ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
    </label>
  );
}

export function Modal({ title, onClose, children, width = 480 }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink/30 p-4 pt-[10vh]" onMouseDown={onClose}>
      <div className="w-full rounded-2xl bg-white shadow-pop" style={{ maxWidth: width }} onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h3 className="text-[15px] font-bold text-ink">{title}</h3>
          <button onClick={onClose} className="rounded-md p-1 text-muted hover:bg-hover">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <label className="mb-4 block">
      <span className="mb-1.5 block text-xs font-semibold text-ink-2">{label}</span>
      {children}
    </label>
  );
}

export const inputCls = "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand";

export function Empty({ icon: Icon, title, children }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line px-6 py-10 text-center">
      {Icon && <Icon size={26} className="mb-2 text-muted" />}
      <p className="text-sm font-semibold text-ink">{title}</p>
      {children && <div className="mt-1 text-sm text-muted">{children}</div>}
    </div>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="flex gap-1 border-b border-line">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cx(
            "-mb-px flex items-center gap-1.5 border-b-2 px-3 pb-2.5 pt-1 text-sm font-medium transition",
            value === t.id ? "border-brand text-ink" : "border-transparent text-muted hover:text-ink"
          )}
        >
          {t.icon && <t.icon size={15} />}
          {t.label}
          {t.count != null && <span className="rounded-full bg-hover px-1.5 text-[11px] font-semibold text-ink-2">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}
