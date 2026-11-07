import type { ReactNode } from "react";

// ─── Money ────────────────────────────────────────────────────────────────────
export function fmt(n: number, ccy = "UGX") {
  const sign = n < 0 ? "-" : "";
  return `${sign}${Math.abs(Math.round(n)).toLocaleString("en-US")} ${ccy}`;
}
export function Money({ v, ccy = "UGX" }: { v: number; ccy?: string }) {
  return <span className="tabnum">{fmt(v, ccy)}</span>;
}

// ─── Status pill ──────────────────────────────────────────────────────────────
const PILL: Record<string, string> = {
  ACTIVE:            "bg-emerald-100 text-emerald-700",
  INACTIVE:          "bg-slate-100 text-slate-500",
  resolved:          "bg-emerald-100 text-emerald-700",
  open:              "bg-amber-100 text-amber-700",
  escalated:         "bg-red-100 text-red-700",
  matched:           "bg-emerald-100 text-emerald-700",
  mismatch:          "bg-amber-100 text-amber-700",
  yo_only:           "bg-blue-100 text-blue-700",
  server_only:       "bg-indigo-100 text-indigo-700",
  duplicate:         "bg-slate-100 text-slate-500",
  draft:             "bg-slate-100 text-slate-500",
  calculating:       "bg-blue-100 text-blue-700",
  ready:             "bg-blue-100 text-blue-700",
  calculated:        "bg-blue-100 text-blue-700",
  awaiting_approval: "bg-amber-100 text-amber-700",
  approved:          "bg-emerald-100 text-emerald-700",
  paid:              "bg-emerald-100 text-emerald-700",
  submitted:         "bg-blue-100 text-blue-700",
  pending:           "bg-amber-100 text-amber-700",
  rejected:          "bg-red-100 text-red-700",
  transferred:       "bg-emerald-100 text-emerald-700",
  CLEARED:           "bg-emerald-100 text-emerald-700",
  OVERDUE:           "bg-red-100 text-red-700",
  ON_HOLD:           "bg-slate-100 text-slate-500",
  ADMIN:             "bg-indigo-100 text-indigo-700",
  ACCOUNTANT:        "bg-blue-100 text-blue-700",
  APPROVER:          "bg-purple-100 text-purple-700",
  VIEWER:            "bg-slate-100 text-slate-500",
};
export function Pill({ s }: { s: string }) {
  const cls = PILL[s] ?? "bg-slate-100 text-slate-500";
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${cls}`}>
      {s.replace(/_/g, " ")}
    </span>
  );
}

// ─── KPI card ─────────────────────────────────────────────────────────────────
export function Kpi({
  label, value, sub, accent,
}: {
  label: string; value: ReactNode; sub?: string; accent?: boolean;
}) {
  return (
    <div className={`rounded-lg border p-3 shadow-sm sm:p-4 ${accent ? "border-[#0B4F7C] bg-[#E6F1FA]" : "border-[#E2E8F0] bg-white"}`}>
      <p className="text-xs text-slate-500 leading-tight">{label}</p>
      <p className={`mt-1 text-lg font-semibold tabnum sm:text-xl ${accent ? "text-[#0B4F7C]" : "text-slate-900"}`}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({
  title, children, action,
}: {
  title?: string; children: ReactNode; action?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-[#E2E8F0] bg-white shadow-sm">
      {(title || action) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] px-4 py-3">
          {title && <h2 className="font-semibold text-slate-800">{title}</h2>}
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

// ─── Scrollable table wrapper ─────────────────────────────────────────────────
// Wrap any <table> in this to get horizontal scroll on small screens.
export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="min-w-full">{children}</div>
    </div>
  );
}

// ─── Table helpers ────────────────────────────────────────────────────────────
export function Th({ ch, r }: { ch: ReactNode; r?: boolean }) {
  return (
    <th
      className={`border-b border-[#E2E8F0] bg-slate-50 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap ${r ? "text-right" : "text-left"}`}
    >
      {ch}
    </th>
  );
}
export function Td({ ch, r, cls = "" }: { ch: ReactNode; r?: boolean; cls?: string }) {
  return (
    <td className={`border-b border-slate-100 px-3 py-2.5 ${r ? "text-right tabnum" : ""} ${cls}`}>
      {ch}
    </td>
  );
}
export function Empty({ msg }: { msg: string }) {
  return <p className="py-8 text-center text-sm text-slate-400">{msg}</p>;
}

// ─── Page header ──────────────────────────────────────────────────────────────
export function PageHeader({
  title, sub, action,
}: {
  title: string; sub?: string; action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">{title}</h1>
        {sub && <p className="mt-0.5 text-sm text-slate-500">{sub}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// ─── Stage tracker ────────────────────────────────────────────────────────────
const STAGES = ["Import", "Reconcile", "Review", "Calculate", "Approve", "Disburse", "EFRIS"];
export function StageTracker({ current }: { current: number }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {STAGES.map((s, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <div
            key={s}
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium
              ${done ? "bg-emerald-100 text-emerald-700" : active ? "bg-[#0B4F7C] text-white" : "bg-slate-100 text-slate-500"}`}
          >
            <span className="text-[10px] font-bold">{i + 1}</span> {s}
          </div>
        );
      })}
    </div>
  );
}

// ─── Info / warning banners ───────────────────────────────────────────────────
export function InfoBanner({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
      {children}
    </div>
  );
}
export function WarnBanner({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
      {children}
    </div>
  );
}
