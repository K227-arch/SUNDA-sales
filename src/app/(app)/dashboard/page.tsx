import Link from "next/link";
import {
  PAYOUT_CYCLE, RECON_MATCHES, CLIENTS, APPROVALS,
  PAYOUT_REQUESTS, HISTORICAL_CYCLES, SOURCES,
} from "@/lib/mock";
import { Kpi, Card, StageTracker, Pill, fmt } from "@/components/ui";

export default function DashboardPage() {
  const calcs = PAYOUT_CYCLE.calcs;

  // SAD §7.3: dashboard bar chart shows 12-month REGISTERED sales (EFRIS)
  const currentCollection = calcs.reduce((a, c) => a + c.gross, 0);
  const currentTransfer   = calcs.reduce((a, c) => a + c.net, 0);
  const currentCommission = calcs.reduce((a, c) => a + c.commission, 0);

  const openRecon      = RECON_MATCHES.filter((r) => r.status === "open").length;
  const activeClients  = CLIENTS.filter((c) => c.status === "ACTIVE").length;
  const pendingAppr    = APPROVALS.filter((a) => a.status === "pending").length;
  const pendingReq     = PAYOUT_REQUESTS.filter((r) => r.status === "pending").length;

  // Non-registered sources alert (SAD §3.5)
  const nonRegistered  = SOURCES.filter((s) => s.contractId === null && s.status === "ACTIVE").length;

  // SAD §7.3: stage index based on cycle status
  const stageIdx =
    PAYOUT_CYCLE.status === "awaiting_approval" ? 4
    : PAYOUT_CYCLE.status === "approved"        ? 5
    : PAYOUT_CYCLE.status === "paid"            ? 6
    : 3;

  // 12-month chart — registered sales (SAD §7.3) + collection side-by-side
  const chartData = HISTORICAL_CYCLES;
  const maxV = Math.max(...chartData.map((d) => d.collection));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">Dashboard</h1>
        <p className="text-sm text-slate-500">Sep 2026 · auto-updated 1st of each month at 00:00 EAT</p>
      </div>

      {/* Non-registered sources alert (SAD §3.5) */}
      {nonRegistered > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          <span className="text-lg">⚠</span>
          <div>
            <strong>{nonRegistered} non-registered source{nonRegistered > 1 ? "s" : ""}</strong> detected from the
            SUNDA main server. These water points are not linked to any contract.{" "}
            <Link href="/clients" className="font-medium underline">Register them on a contract →</Link>
          </div>
        </div>
      )}

      {/* Stage tracker */}
      <Card title="Process stages — Sep 2026">
        <StageTracker current={stageIdx} />
        <p className="mt-2 text-xs text-slate-400">
          Status: <span className="font-medium text-slate-600">{PAYOUT_CYCLE.status.replace(/_/g, " ")}</span>
        </p>
      </Card>

      {/* KPI cards — linked to their detail pages (SAD §9.1 S2) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Link href="/reconciliation">
          <Kpi label="Water collection" value={fmt(currentCollection)} sub="Sep 2026" accent />
        </Link>
        <Link href="/payout-cycle">
          <Kpi label="Transfer amount" value={fmt(currentTransfer)} sub="Sep 2026" />
        </Link>
        <Link href="/efris">
          <Kpi label="Sunda commission" value={fmt(currentCommission)} sub="= EFRIS sales" />
        </Link>
        <Link href="/clients">
          <Kpi label="Active clients" value={activeClients} />
        </Link>
        <Link href="/approvals">
          <Kpi label="Pending approvals" value={pendingAppr}
            sub={pendingAppr > 0 ? "action required" : "all clear"} />
        </Link>
        <Link href="/payout-requests">
          <Kpi label="Liquidation requests" value={pendingReq} />
        </Link>
      </div>

      {/* 12-month registered sales bar chart (SAD §7.3) */}
      <Card title="12-month registered sales on EFRIS (UGX)">
        <p className="mb-3 text-xs text-slate-400">
          Blue bars = registered EFRIS sales. Grey = collection (reference). Sep 2026 not yet registered.
        </p>
        <div className="flex items-end gap-0.5 h-36 pt-2 sm:gap-1">
          {chartData.map((d) => {
            const collPct  = Math.round((d.collection / maxV) * 100);
            const salesPct = d.registeredSales > 0
              ? Math.round((d.registeredSales / maxV) * 100)
              : 0;
            const isCurrent = d.period === "2026-09";
            const label = d.period.replace("20", "").replace("-", "/");
            return (
              <div key={d.period} className="flex flex-1 flex-col items-center gap-0.5">
                <div className="flex w-full flex-col-reverse items-center" style={{ height: "120px" }}>
                  {/* Collection bar (background) */}
                  <div
                    className={`w-full rounded-t-sm ${isCurrent ? "bg-slate-200" : "bg-slate-100"}`}
                    style={{ height: `${collPct}%` }}
                    title={`Collection: ${fmt(d.collection)}`}
                  />
                </div>
                {/* EFRIS registered overlay */}
                <div
                  className="absolute w-full rounded-t-sm bg-[#0B4F7C] opacity-90"
                  style={{ height: `${salesPct}%`, bottom: "24px", position: "relative", marginBottom: `-${salesPct}%` }}
                  title={`Registered sales: ${fmt(d.registeredSales)}`}
                />
                <span className="text-[8px] text-slate-400 sm:text-[9px]">{label}</span>
              </div>
            );
          })}
        </div>
        {/* Legend */}
        <div className="mt-2 flex gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-4 rounded-sm bg-slate-200"/>Collection</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-4 rounded-sm bg-[#0B4F7C]"/>EFRIS registered sales</span>
        </div>
      </Card>

      {/* Bottom row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Reconciliation summary */}
        <Card title="Reconciliation — Sep 2026">
          <div className="space-y-2 text-sm">
            {[
              { label: "Matched",                  v: RECON_MATCHES.filter((r) => r.type === "matched").length,     c: "text-emerald-600" },
              { label: "Mismatch",                 v: RECON_MATCHES.filter((r) => r.type === "mismatch").length,    c: "text-amber-600"   },
              { label: "Yo!Uganda only",           v: RECON_MATCHES.filter((r) => r.type === "yo_only").length,     c: "text-blue-600"    },
              { label: "SUNDA server only",        v: RECON_MATCHES.filter((r) => r.type === "server_only").length, c: "text-indigo-600"  },
              { label: "Open / needs escalation",  v: openRecon,                                                     c: "text-red-600"     },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="text-slate-600">{row.label}</span>
                <span className={`font-semibold ${row.c}`}>{row.v}</span>
              </div>
            ))}
            <Link href="/reconciliation" className="mt-1 block text-xs text-[#0B4F7C] hover:underline">
              View all →
            </Link>
          </div>
        </Card>

        {/* Per-client net transfer */}
        <Card title="Sep 2026 — net transfer per client">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500">
                  <th className="pb-1 text-left">Client</th>
                  <th className="pb-1 text-right">Gross</th>
                  <th className="pb-1 text-right">Net</th>
                  <th className="pb-1 pl-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {calcs.map((c) => (
                  <tr key={c.id} className="border-t border-slate-100">
                    <td className="py-1.5 pr-2 max-w-[110px] truncate">
                      <Link href={`/clients/${c.clientId}`} className="text-[#0B4F7C] hover:underline">
                        {c.clientName}
                      </Link>
                    </td>
                    <td className="py-1.5 text-right tabnum text-slate-500">{fmt(c.gross)}</td>
                    <td className="py-1.5 text-right tabnum font-semibold text-[#0B4F7C]">{fmt(c.net)}</td>
                    <td className="py-1.5 pl-2"><Pill s={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Link href="/payout-cycle" className="mt-2 block text-xs text-[#0B4F7C] hover:underline">
            Open full payout cycle →
          </Link>
        </Card>
      </div>
    </div>
  );
}
