"use client";

import {
  useEffect,
  useId,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { X } from "lucide-react";

export type Tone = "ok" | "warn" | "danger" | "info" | "active" | "muted" | "brand";

export function Button({
  variant = "secondary",
  size = "md",
  icon,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "text";
  size?: "sm" | "md";
  icon?: ReactNode;
}) {
  return (
    <button className={`p-btn p-btn-${variant} p-btn-${size}`} {...rest}>
      {icon}
      {children}
    </button>
  );
}

export function Badge({ tone = "muted", children, dot }: { tone?: Tone; children: ReactNode; dot?: boolean }) {
  return (
    <span className={`p-badge p-badge-${tone}`}>
      {dot !== false && <i className="p-badge-dot" />}
      {children}
    </span>
  );
}

export function StatusDot({ tone = "muted" }: { tone?: Tone }) {
  return <i className={`p-dot p-dot-${tone}`} />;
}

export function Field({
  label,
  hint,
  error,
  children,
  required,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label className={`p-field${error ? " is-error" : ""}`}>
      <span className="p-field-label">
        {label}
        {required && <em>*</em>}
      </span>
      {children}
      {error ? <span className="p-field-error">{error}</span> : hint ? <span className="p-field-hint">{hint}</span> : null}
    </label>
  );
}

export function TextInput({ invalid, ...rest }: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return <input className={`p-input${invalid ? " is-invalid" : ""}`} {...rest} />;
}

export function Textarea({ invalid, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return <textarea className={`p-input p-textarea${invalid ? " is-invalid" : ""}`} {...rest} />;
}

export function Select({ children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className="p-input p-select" {...rest}>
      {children}
    </select>
  );
}

export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button type="button" className={`p-switch${on ? " is-on" : ""}`} onClick={() => onChange(!on)} aria-pressed={on}>
      <i />
      {label && <span>{label}</span>}
    </button>
  );
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
}: {
  items: { key: T; label: string; count?: number }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="p-tabs" role="tablist">
      {items.map((it) => (
        <button
          key={it.key}
          role="tab"
          aria-selected={value === it.key}
          className={`p-tab${value === it.key ? " is-active" : ""}`}
          onClick={() => onChange(it.key)}
        >
          {it.label}
          {typeof it.count === "number" && <em>{it.count}</em>}
        </button>
      ))}
    </div>
  );
}

export interface Column<T> {
  key: string;
  title: string;
  width?: string;
  align?: "left" | "right";
  render: (row: T) => ReactNode;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  empty = "没有符合条件的数据",
  emptyHint,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  empty?: string;
  emptyHint?: string;
}) {
  return (
    <div className="p-table-wrap">
      <table className="p-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} style={{ width: c.width, textAlign: c.align }}>
                {c.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className={onRowClick ? "is-clickable" : undefined}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((c) => (
                <td key={c.key} style={{ textAlign: c.align }}>
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <EmptyState title={empty} hint={emptyHint} />}
    </div>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="p-empty">
      <div className="p-empty-mark" />
      <b>{title}</b>
      {hint && <p>{hint}</p>}
      {action}
    </div>
  );
}

export function LoadingState({ text = "加载中…" }: { text?: string }) {
  return (
    <div className="p-loading">
      <i />
      <span>{text}</span>
    </div>
  );
}

export function ErrorState({ title = "加载失败", hint, onRetry }: { title?: string; hint?: string; onRetry?: () => void }) {
  return (
    <div className="p-error-state">
      <b>{title}</b>
      {hint && <p>{hint}</p>}
      {onRetry && (
        <Button size="sm" onClick={onRetry}>
          重试
        </Button>
      )}
    </div>
  );
}

export function Drawer({
  open,
  title,
  sub,
  onClose,
  children,
  footer,
  width = 520,
}: {
  open: boolean;
  title: string;
  sub?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="p-overlay" onMouseDown={onClose}>
      <aside className="p-drawer" style={{ width }} onMouseDown={(e) => e.stopPropagation()}>
        <header className="p-drawer-head">
          <div>
            <h3>{title}</h3>
            {sub && <p>{sub}</p>}
          </div>
          <button className="p-icon-btn" onClick={onClose} aria-label="关闭">
            <X size={16} />
          </button>
        </header>
        <div className="p-drawer-body">{children}</div>
        {footer && <footer className="p-drawer-foot">{footer}</footer>}
      </aside>
    </div>
  );
}

export function Dialog({
  open,
  title,
  children,
  confirmText = "确认",
  cancelText = "取消",
  danger,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="p-overlay p-overlay-center" onMouseDown={onClose}>
      <div className="p-dialog" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h3>{title}</h3>
        <div className="p-dialog-body">{children}</div>
        <div className="p-dialog-foot">
          <Button onClick={onClose}>{cancelText}</Button>
          <Button variant={danger ? "danger" : "primary"} onClick={onConfirm}>
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Timeline({
  items,
  compact,
}: {
  items: { key: string; label: string; at?: string; note?: string; state: "done" | "active" | "todo" | "error" }[];
  compact?: boolean;
}) {
  return (
    <ol className={`p-timeline${compact ? " is-compact" : ""}`}>
      {items.map((it) => (
        <li key={it.key} className={`p-tl-item is-${it.state}`}>
          <i className="p-tl-node" />
          <div className="p-tl-main">
            <b>{it.label}</b>
            {it.at && <time>{it.at}</time>}
            {it.note && <p>{it.note}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function Stats({ items }: { items: { label: string; value: ReactNode; hint?: string; tone?: Tone }[] }) {
  return (
    <div className="p-stats">
      {items.map((it) => (
        <div key={it.label} className="p-stat">
          <span>{it.label}</span>
          <b className={it.tone ? `t-${it.tone}` : undefined}>{it.value}</b>
          {it.hint && <em>{it.hint}</em>}
        </div>
      ))}
    </div>
  );
}

function axisMax(raw: number) {
  const half = Math.max(1, raw / 2);
  const mag = Math.pow(10, Math.floor(Math.log10(half)));
  const n = half / mag;
  const step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag;
  return step * 2;
}

export function BarChart({
  data,
  series,
  height = 160,
}: {
  data: { d: string; [k: string]: number | string }[];
  series: { key: string; label: string; color: string }[];
  height?: number;
}) {
  const rawMax = Math.max(1, ...data.flatMap((row) => series.map((s) => Number(row[s.key]) || 0)));
  const max = axisMax(rawMax);
  const tick = (v: number) => (v >= 10000 ? `${Math.round(v / 1000)}k` : String(Math.round(v)));
  return (
    <div className="p-chart">
      <div className="p-chart-legend">
        {series.map((s) => (
          <span key={s.key}>
            <i style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      <div className="p-chart-body">
        <div className="p-chart-axis" style={{ height }}>
          <span style={{ bottom: "100%" }}>{tick(max)}</span>
          <span style={{ bottom: "50%" }}>{tick(max / 2)}</span>
          <span style={{ bottom: 0 }}>0</span>
        </div>
        <div className="p-chart-main">
          <div className="p-chart-plot" style={{ height }}>
            <div className="p-chart-grid" style={{ bottom: "100%" }} />
            <div className="p-chart-grid" style={{ bottom: "50%" }} />
            {data.map((row, i) => (
              <div
                key={row.d}
                className="p-chart-group"
                style={{ left: `${(i * 100) / data.length}%`, width: `${100 / data.length}%` }}
              >
                {series.map((s) => {
                  const v = Number(row[s.key]) || 0;
                  return (
                    <i
                      key={s.key}
                      style={{ height: `${(v / max) * 100}%`, background: s.color }}
                      title={`${row.d} · ${s.label} ${v}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          <div className="p-chart-x" style={{ gridTemplateColumns: `repeat(${data.length}, 1fr)` }}>
            {data.map((row) => (
              <span key={row.d}>{row.d}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Donut({
  value,
  total,
  label,
  color = "#2563EB",
  size = 96,
}: {
  value: number;
  total: number;
  label: string;
  color?: string;
  size?: number;
}) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  const r = size / 2 - 7;
  const c = 2 * Math.PI * r;
  return (
    <div className="p-donut">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E2E8F0" strokeWidth="9" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * c} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text x="50%" y="52%" textAnchor="middle" className="p-donut-txt">
          {pct}%
        </text>
      </svg>
      <span>{label}</span>
    </div>
  );
}

export function ToggleGroup({
  items,
  value,
  onChange,
}: {
  items: { key: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="p-toggle-group">
      {items.map((it) => (
        <button
          key={it.key}
          className={value === it.key ? "is-active" : undefined}
          onClick={() => onChange(it.key)}
          type="button"
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

export function Section({
  title,
  desc,
  actions,
  children,
  className,
}: {
  title?: string;
  desc?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`p-section${className ? ` ${className}` : ""}`}>
      {(title || actions) && (
        <header className="p-section-head">
          <div>
            {title && <h2>{title}</h2>}
            {desc && <p>{desc}</p>}
          </div>
          {actions && <div className="p-section-actions">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

export function KeyValue({ items, cols = 2 }: { items: { k: string; v: ReactNode }[]; cols?: number }) {
  return (
    <dl className="p-kv" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
      {items.map((it) => (
        <div key={it.k}>
          <dt>{it.k}</dt>
          <dd>{it.v}</dd>
        </div>
      ))}
    </dl>
  );
}

let idc = 0;
export function useLocalId(prefix = "c") {
  const id = useId();
  const [n] = useState(() => ++idc);
  return `${prefix}${id}${n}`;
}
