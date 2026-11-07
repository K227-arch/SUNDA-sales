"use client";

import Link from "next/link";
import { useState } from "react";
import { PAYOUT_CYCLE, CLIENTS } from "@/lib/mock";
import type { PayoutStatementStatus } from "@/lib/mock";
import { Pill, Card, PageHeader, Money, fmt } from "@/components/ui";

// SAD §7.1 lifecycle — ordered progression
const STATUS_ORDER: PayoutStatementStatus[] = [
  "waiting_for_transfer_month",
  "calculated_draft",
  "under_confirmation",
  "needs_correction",
  "ready_for_authorisation",
  "authorised",
  "transferred",
];

const STATUS_LABEL: Record<PayoutStatementStatus, string> = {
  waiting_for_transfer_month: "Waiting for transfer month",
  calculated_draft:           "Calculated (draft)",
  under_confirmation:         "Under confirmation",
  needs_correction:           "Needs correction",
  ready_for_authorisation:    "Ready for authorisation",
  authorised:                 "Authorised",
  transferred:                "Transferred",
};

const TRANSFER_STATUS_COLOR: Record<string, string> = {
  not_transferred: "bg-slate-100 text-slate-500",
  transferred:     "bg-emerald-100 text-emerald-700",
  failed:          "bg-red-100 text-red-700",
};

export default function PayoutCyclePage() {
  const { calcs, status: cycleStatus, period } = PAYOUT_CYCLE;
  const [activeTab, setActiveTab] = useState<"client" | "source">("client");

  const totals = calcs.reduce(
    (a, c) => ({
      gross: a.gross + c.gross,
      commission: a.commission + c.commission,
      loanRepay: a.loanRepay + c.loanRepay,
      additionalTransfer: a.additionalTransfer + c.additionalTransfer,
      net: a.net + c.net,
    }),
    { gross: 0, commission: 0, loanRepay: 0, additionalTransfer: 0, net: 0 },
  );

  // Build per-source view from calcs + CLIENTS sources
  const sourceRows = calcs.flatMap((calc) => {
    const client = CLIENTS.find((c) => c.id === calc.clientId);
    const contract = client?.contracts.find((c) => c.id === calc.contractId);
    return (contract?.sources ?? []).map((s) => ({
      sourceId: s.sourceId,
      sourceName: s.name,
      clientName: calc.clientName,
      contractRef: calc.contractRef,
      calcNet: calc.net / Math.max((contract?.sources.length ?? 1), 1),
      status: calc.status,
      transferStatus: calc.transferStatus,
    }));
  });

  const canSubmit = calcs.every((c) =>
    c.status === "under_confirmation" || c.status === "ready_for_authorisation"
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Payout cycle — ${period}`}
        sub="SAD §7.1 lifecycle: draft → confirmation → authorisation → transfer"
        action={
          <div className="flex flex-wrap gap-2">
            <button className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
              Recalculate
            </button>
            <button
              disabled={!canSubmit}
              className={`rounded-md px-4 py-2 text-sm font-medium text-white
                ${canSubmit ? "bg-[#0B4F7C] hover:bg-[#0a4570]" : "cursor-not-allowed bg-slate-300"}`}
              title={!canSubmit ? "All lines must be under confirmation or ready" : undefined}
            >
              Submit all for approval
            </button>
          </div>
        }
      />

      {/* Cycle status */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[#E2E8F0] bg-white px-4 py-3 text-sm">
        <span className="text-slate-500">Cycle status:</span>
        <Pill s={cycleStatus} />
        <span className="text-slate-300">|</span>
        <span className="text-slate-500 text-xs">
          Transfers: {calcs.filter((c) => c.transferStatus === "transferred").length}/{calcs.length} done
        </span>
      </div>

      {/* Summary totals */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {[
          { label: "Gross collection",    v: totals.gross,              accent: false },
          { label: "Sunda commission",    v: totals.commission,         accent: false },
          { label: "Loan repayments",     v: totals.loanRepay,          accent: false },
          { label: "Additional transfers",v: totals.additionalTransfer, accent: false },
          { label: "Net transferred",     v: totals.net,                accent: true  },
        ].map((k) => (
          <div key={k.label} className={`rounded-lg border p-3 ${k.accent ? "border-[#0B4F7C] bg-[#E6F1FA]" : "border-[#E2E8F0] bg-white"}`}>
            <p className="text-xs text-slate-500 leading-tight">{k.label}</p>
            <p className={`mt-1 text-lg font-semibold tabnum ${k.accent ? "text-[#0B4F7C]" : "text-slate-900"}`}>
              {fmt(k.v)}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs — client by month / source by month (SAD §9.1 S7) */}
      <Card
        title="Breakdown"
        action={
          <button className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
            Download report
          </button>
        }
      >
        <div className="mb-4 flex gap-1 border-b border-[#E2E8F0]">
          {(["client","source"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-2 text-sm font-medium transition-colors
                ${activeTab === t
                  ? "border-b-2 border-[#0B4F7C] text-[#0B4F7C]"
                  : "text-slate-500 hover:text-slate-700"}`}
            >
              {t === "client" ? "Client by month" : "Source by month"}
            </button>
          ))}
        </div>

        {/* ── Client-by-month tab ── */}
        {activeTab === "client" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs uppercase text-slate-500">
                  {["Client","Contract","Acct","Gross","Commission","Loan","Addl. transfer","Net","Statement status","Transfer status","Actions"].map((h) => (
                    <th key={h} className="border-b border-[#E2E8F0] px-3 py-2.5 text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {calcs.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="border-b border-slate-100 px-3 py-2.5">
                      <Link href={`/clients/${c.clientId}`} className="font-medium text-[#0B4F7C] hover:underline whitespace-nowrap">
                        {c.clientName}
                      </Link>
                    </td>
                    <td className="border-b border-slate-100 px-3 py-2.5 text-xs text-slate-500 whitespace-nowrap">{c.contractRef}</td>
                    <td className="border-b border-slate-100 px-3 py-2.5 text-xs whitespace-nowrap">{c.accountType}</td>
                    <td className="border-b border-slate-100 px-3 py-2.5 text-right tabnum"><Money v={c.gross} /></td>
                    <td className="border-b border-slate-100 px-3 py-2.5 text-right tabnum"><Money v={c.commission} /></td>
                    <td className="border-b border-slate-100 px-3 py-2.5 text-right tabnum"><Money v={c.loanRepay} /></td>
                    <td className="border-b border-slate-100 px-3 py-2.5 text-right tabnum">
                      {c.additionalTransfer > 0
                        ? <span className="text-amber-600"><Money v={c.additionalTransfer} /></span>
                        : <span className="text-slate-300">—</span>}
                    </td>
                    <td className={`border-b border-slate-100 px-3 py-2.5 text-right tabnum font-semibold whitespace-nowrap
                      ${c.net <= 0 ? "text-red-600" : "text-[#0B4F7C]"}`}>
                      <Money v={c.net} />
                    </td>
                    {/* SAD §7.1 statement lifecycle status */}
                    <td className="border-b border-slate-100 px-3 py-2.5">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 whitespace-nowrap">
                        {STATUS_LABEL[c.status]}
                      </span>
                    </td>
                    {/* SAD §7.1 transfer status */}
                    <td className="border-b border-slate-100 px-3 py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-xs whitespace-nowrap ${TRANSFER_STATUS_COLOR[c.transferStatus]}`}>
                        {c.transferStatus.replace(/_/g," ")}
                      </span>
                    </td>
                    <td className="border-b border-slate-100 px-3 py-2.5">
                      <div className="flex gap-1">
                        <Link href={`/payout-cycle/${c.id}`}
                          className="rounded bg-[#0B4F7C] px-2 py-0.5 text-xs text-white hover:bg-[#0a4570] whitespace-nowrap">
                          Breakdown →
                        </Link>
                        {c.status === "authorised" && c.transferStatus === "not_transferred" && (
                          <button className="rounded bg-emerald-600 px-2 py-0.5 text-xs text-white whitespace-nowrap">
                            Mark transferred
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {/* Totals row */}
                <tr className="bg-slate-50 font-semibold">
                  <td className="px-3 py-2.5" colSpan={3}>Total</td>
                  <td className="px-3 py-2.5 text-right tabnum"><Money v={totals.gross} /></td>
                  <td className="px-3 py-2.5 text-right tabnum"><Money v={totals.commission} /></td>
                  <td className="px-3 py-2.5 text-right tabnum"><Money v={totals.loanRepay} /></td>
                  <td className="px-3 py-2.5 text-right tabnum"><Money v={totals.additionalTransfer} /></td>
                  <td className="px-3 py-2.5 text-right tabnum text-[#0B4F7C]"><Money v={totals.net} /></td>
                  <td colSpan={3} />
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* ── Source-by-month tab ── */}
        {activeTab === "source" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs uppercase text-slate-500">
                  {["Source ID","Source name","Client","Contract","Est. net share","Statement","Transfer"].map((h) => (
                    <th key={h} className="border-b border-[#E2E8F0] px-3 py-2.5 text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sourceRows.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="border-b border-slate-100 px-3 py-2.5 text-xs text-slate-500 whitespace-nowrap">{r.sourceId}</td>
                    <td className="border-b border-slate-100 px-3 py-2.5 font-medium whitespace-nowrap">{r.sourceName}</td>
                    <td className="border-b border-slate-100 px-3 py-2.5 whitespace-nowrap">{r.clientName}</td>
                    <td className="border-b border-slate-100 px-3 py-2.5 text-xs text-slate-500 whitespace-nowrap">{r.contractRef}</td>
                    <td className="border-b border-slate-100 px-3 py-2.5 text-right tabnum"><Money v={Math.round(r.calcNet)} /></td>
                    <td className="border-b border-slate-100 px-3 py-2.5">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 whitespace-nowrap">
                        {STATUS_LABEL[r.status]}
                      </span>
                    </td>
                    <td className="border-b border-slate-100 px-3 py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-xs whitespace-nowrap ${TRANSFER_STATUS_COLOR[r.transferStatus]}`}>
                        {r.transferStatus.replace(/_/g," ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-xs text-slate-400">
              * Net share is estimated proportionally across sources per contract.
              Actual collection per source requires the SUNDA main-server collections endpoint.
            </p>
          </div>
        )}
      </Card>

      {/* Quick-jump to individual breakdowns */}
      <Card title="Per-client detailed breakdown">
        <div className="flex flex-wrap gap-2">
          {calcs.map((c) => (
            <Link key={c.id} href={`/payout-cycle/${c.id}`}
              className="rounded-md border border-[#0B4F7C] px-3 py-1.5 text-sm text-[#0B4F7C] hover:bg-[#E6F1FA]">
              {c.clientName} →
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
