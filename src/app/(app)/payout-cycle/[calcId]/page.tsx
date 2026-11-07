import { notFound } from "next/navigation";
import Link from "next/link";
import { PAYOUT_CYCLE, CLIENTS, MANUAL_PAYMENTS } from "@/lib/mock";
import type { PayoutStatementStatus } from "@/lib/mock";
import { Pill, Card, Money, fmt } from "@/components/ui";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<PayoutStatementStatus, string> = {
  waiting_for_transfer_month: "Waiting for transfer month",
  calculated_draft:           "Calculated (draft)",
  under_confirmation:         "Under confirmation",
  needs_correction:           "Needs correction",
  ready_for_authorisation:    "Ready for authorisation",
  authorised:                 "Authorised",
  transferred:                "Transferred",
};

// SAD §7.1 — next valid action per status
const NEXT_ACTION: Partial<Record<PayoutStatementStatus, string>> = {
  calculated_draft:        "Start confirmation",
  under_confirmation:      "Submit for authorisation",
  needs_correction:        "Resubmit after correction",
  ready_for_authorisation: "Awaiting approver",
  authorised:              "Mark as transferred",
};

export default async function PayoutBreakdownPage({ params }: { params: Promise<{ calcId: string }> }) {
  const { calcId } = await params;
  const calc = PAYOUT_CYCLE.calcs.find((c) => c.id === calcId);
  if (!calc) notFound();

  const client   = CLIENTS.find((c) => c.id === calc.clientId);
  const contract = client?.contracts.find((c) => c.id === calc.contractId);
  const loan     = contract?.unitLoan ?? null;

  // Manual payments for this contract this period
  const manualPmts = MANUAL_PAYMENTS.filter(
    (m) => m.contractId === calc.contractId
  );

  // SAD §6.2 itemised formula rows
  const ROWS = [
    { label: "Gross reconciled collection",           v: calc.gross,              indent: 0, sign: "" },
    { label: "− Initial payment deduction",           v: -calc.initialFee,        indent: 1, sign: "−" },
    { label: "− Monthly fee",                         v: -calc.monthlyFee,        indent: 1, sign: "−",
      tag: calc.monthlyFeeCovered ? "covered ✓" : "not covered ⚠" },
    { label: "− Maintenance fee",                     v: -calc.maintenanceFee,    indent: 1, sign: "−" },
    { label: "− Bank transfer charge",                v: -calc.bankCharge,        indent: 1, sign: "−" },
    { label: "− Unit loan repayment",                 v: -calc.loanRepay,         indent: 1, sign: "−" },
    { label: "− Shortage from previous month",        v: -calc.shortage,          indent: 1, sign: "−" },
    { label: "− Additional transfers already paid",   v: -calc.additionalTransfer, indent: 1, sign: "−" },
    { label: "− Other manual deductions",             v: -calc.other,             indent: 1, sign: "−" },
    { label: "= Net transferred amount",              v: calc.net,                indent: 0, sign: "", total: true },
  ].filter((r) => r.v !== 0 || r.total);

  const canSubmit = calc.net > 0 && calc.flags.length === 0
    && (calc.status === "under_confirmation" || calc.status === "calculated_draft");

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Link href="/payout-cycle" className="text-[#0B4F7C] hover:underline">← Payout cycle</Link>
        <span className="text-slate-300">/</span>
        <span className="font-medium">{calc.clientName}</span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
          {STATUS_LABEL[calc.status]}
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">{calc.clientName}</h1>
          <p className="text-sm text-slate-500">{calc.contractRef} · {calc.period} · {calc.accountType}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
            Download Excel
          </button>
          {NEXT_ACTION[calc.status] && (
            <button
              disabled={!canSubmit && calc.status !== "authorised"}
              className={`rounded-md px-4 py-2 text-sm font-medium text-white
                ${canSubmit || calc.status === "authorised"
                  ? "bg-[#0B4F7C] hover:bg-[#0a4570]"
                  : "cursor-not-allowed bg-slate-300"}`}
              title={!canSubmit && calc.net <= 0 ? "Net ≤ 0 — adjust fees first" : undefined}
            >
              {NEXT_ACTION[calc.status]}
            </button>
          )}
        </div>
      </div>

      {/* Guards */}
      {calc.flags.length > 0 && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3">
          <p className="mb-1 text-xs font-semibold text-red-700">Flags — resolve before submitting</p>
          <div className="flex flex-wrap gap-1">
            {calc.flags.map((f) => (
              <span key={f} className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">{f.replace(/_/g," ")}</span>
            ))}
          </div>
        </div>
      )}
      {!calc.monthlyFeeCovered && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          ⚠ Monthly fee not fully covered. The shortfall carries forward to next month.
        </div>
      )}
      {calc.net <= 0 && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          ⛔ Net ≤ 0 — adjust another fee (monthly / initial) before submitting.
        </div>
      )}

      {/* Transfer status */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[#E2E8F0] bg-white px-4 py-3 text-sm">
        <span className="text-slate-500">Transfer status:</span>
        <span className={`rounded-full px-3 py-0.5 text-xs font-medium
          ${calc.transferStatus === "transferred" ? "bg-emerald-100 text-emerald-700"
            : calc.transferStatus === "failed"    ? "bg-red-100 text-red-700"
            : "bg-slate-100 text-slate-500"}`}>
          {calc.transferStatus.replace(/_/g," ")}
        </span>
        {calc.transferredAt && (
          <span className="text-xs text-slate-400">
            by {calc.transferredBy} on {calc.transferredAt}
          </span>
        )}
      </div>

      {/* SAD §6.2 itemised breakdown */}
      <Card title="Calculation breakdown (SAD §6.2)">
        <div className="space-y-1">
          {ROWS.map((row) => (
            <div
              key={row.label}
              className={`flex items-center justify-between py-1.5
                ${row.total ? "mt-2 border-t-2 border-slate-300 pt-2 font-semibold" : ""}
                ${row.indent === 1 ? "pl-4" : ""}`}
            >
              <span className={`text-sm ${row.total ? "text-slate-900" : "text-slate-600"}`}>
                {row.label}
                {"tag" in row && row.tag && (
                  <span className={`ml-2 rounded-full px-2 py-0.5 text-xs
                    ${"tag" in row && typeof row.tag === "string" && row.tag.includes("⚠")
                      ? "bg-amber-100 text-amber-700"
                      : "bg-emerald-100 text-emerald-700"}`}>
                    {"tag" in row ? row.tag : ""}
                  </span>
                )}
              </span>
              <span className={`tabnum ${row.total ? "text-lg text-[#0B4F7C]" : row.v < 0 ? "text-slate-500" : "text-slate-900"}`}>
                <Money v={row.v} />
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-slate-400 space-y-0.5">
          <p>Commission (= EFRIS sales) = initial + monthly + maintenance + bank charge + additional transfer fee</p>
          {contract && (
            <p>
              Terms: commission {(contract.commissionPct * 100).toFixed(0)}% ·
              monthly {fmt(contract.monthlyFeeFixed)} + {(contract.monthlyFeePct * 100).toFixed(0)}% ·
              maintenance {contract.maintenanceFeeType === "PERCENTAGE"
                ? `${(contract.maintenanceFeeValue * 100).toFixed(0)}%`
                : fmt(contract.maintenanceFeeValue)} ({contract.maintenanceFeeType.toLowerCase().replace(/_/g," ")})
            </p>
          )}
        </div>
      </Card>

      {/* Per-contract toggle note (SAD §6.3 rule 4) */}
      <div className="rounded-md border border-[#E2E8F0] bg-slate-50 p-3 text-xs text-slate-500">
        SAD §6.3: Breakdown and loan table can be shown separately for each contract.
        This client has {client?.contracts.length ?? 1} contract(s).
        {(client?.contracts.length ?? 0) > 1 && (
          <span className="ml-1 font-medium text-[#0B4F7C]">
            Use the tabs above on the payout cycle page to switch contracts.
          </span>
        )}
      </div>

      {/* Loan position (if applicable) */}
      {loan && (
        <Card title="Loan position (SAD §6.3 — shown per contract)">
          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            {[
              ["Principal",          fmt(loan.totalPurchaseAmount)],
              ["This cycle repay",   fmt(calc.loanRepay)],
              ["Balance after",      fmt(loan.balance - calc.loanRepay)],
              ["Status",             loan.status],
            ].map(([k,v]) => (
              <div key={k as string}>
                <p className="text-xs text-slate-500">{k}</p>
                <p className="mt-0.5 font-semibold">{v}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Manual payment registration (SAD §5.2 entity; S8 "added to original") */}
      <Card title="Manual payment registration">
        <p className="mb-3 text-sm text-slate-500">
          Register a payment received directly from the client (initial fee, unit fee, monthly fee, other).
          Recorded as a <em>manual_payment</em> entity per SAD §5.2.
        </p>
        {manualPmts.length > 0 && (
          <div className="mb-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500">
                  {["Date","Purpose","Amount","Method","Received by","Note"].map((h) => (
                    <th key={h} className="pb-1.5 text-left whitespace-nowrap pr-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {manualPmts.map((p) => (
                  <tr key={p.id} className="border-t border-slate-100">
                    <td className="py-1.5 pr-3 text-slate-500 whitespace-nowrap">{p.date}</td>
                    <td className="py-1.5 pr-3 text-xs">{p.purpose.replace(/_/g," ")}</td>
                    <td className="py-1.5 pr-3 tabnum font-medium"><Money v={p.amount} /></td>
                    <td className="py-1.5 pr-3 text-xs">{p.method}</td>
                    <td className="py-1.5 pr-3">{p.receivedBy}</td>
                    <td className="py-1.5 text-xs text-slate-400">{p.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <select className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#0B4F7C] focus:outline-none">
            <option value="">Purpose</option>
            <option>INITIAL_FEE</option><option>UNIT_FEE</option>
            <option>MONTHLY_FEE</option><option>OTHER</option>
          </select>
          <input type="number" placeholder="Amount (UGX)"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#0B4F7C] focus:outline-none" />
          <input type="date"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#0B4F7C] focus:outline-none" />
          <select className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#0B4F7C] focus:outline-none">
            <option value="">Method</option>
            <option>CASH</option><option>BANK</option><option>MOBILE_MONEY</option>
          </select>
        </div>
        <button className="mt-3 rounded-md bg-[#0B4F7C] px-4 py-2 text-sm font-medium text-white hover:bg-[#0a4570]">
          Register payment
        </button>
      </Card>
    </div>
  );
}
