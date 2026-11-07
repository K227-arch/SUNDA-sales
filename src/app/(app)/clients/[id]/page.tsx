import { notFound } from "next/navigation";
import Link from "next/link";
import { CLIENTS, PAYOUT_CYCLE } from "@/lib/mock";
import { lookupUser } from "@/lib/adapters/sunda-server";
import { Pill, Card, Money, fmt } from "@/components/ui";
import { ManualReloadForm } from "./ManualReloadForm";

export const dynamic = "force-dynamic";

export default async function ClientProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = CLIENTS.find((c) => c.id === id);
  if (!client) notFound();

  // ── Live data from SUNDA main server [A] users/lookup ─────────────────────
  // paymentId = client.clientId (strip the "C-" prefix to get the 9-char ID)
  const paymentId = client.clientId.replace(/^C-/, "");
  const liveResult = await lookupUser(paymentId);

  // Live fields (fall back to mock values if the server is unavailable or secret not set)
  const liveWaterBalance: number | null = liveResult?.success ? liveResult.data.waterBalance : null;
  const liveStatus: string | null       = liveResult?.success ? liveResult.data.status       : null;
  const liveUpdatedAt: string | null    = liveResult?.success ? liveResult.data.updatedAt     : null;
  const isLive = liveResult?.success === true;

  // ── Mock data (contracts, loans, payout history) ──────────────────────────
  const loanBalance    = client.contracts.reduce((a, c) => a + (c.unitLoan?.balance ?? 0), 0);
  const initFeeBalance = client.contracts.reduce((a, c) => a + c.initialFeeBalance, 0);
  const calcs = PAYOUT_CYCLE.calcs.filter((c) => c.clientId === client.id);
  const fyCollection = calcs.reduce((a, c) => a + c.gross, 0);
  const fyCommission = calcs.reduce((a, c) => a + c.commission, 0);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link href="/clients" className="text-sm text-[#0B4F7C] hover:underline">← Clients</Link>
        <span className="text-slate-300">/</span>
        <h1 className="text-xl font-semibold text-slate-900">{client.name}</h1>
        {/* Show live status if available, else mock status */}
        <Pill s={liveStatus ?? client.status} />
        {isLive && (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
            ● Live from SUNDA server
          </span>
        )}
        {!isLive && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-400">
            Mock data (SUNDA server unavailable)
          </span>
        )}
      </div>

      {/* API error detail */}
      {liveResult && !liveResult.success && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          SUNDA server returned: <strong>{liveResult.error.code}</strong> — {liveResult.error.message}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
          <p className="text-xs text-slate-500">Category</p>
          <p className="mt-1 font-medium">{client.category}</p>
        </div>
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
          <p className="text-xs text-slate-500">Transfer method</p>
          <p className="mt-1 font-medium">{client.transferMethod === "BANK" ? "🏦 Bank" : "📱 Mobile money"}</p>
          <p className="text-xs text-slate-400">{client.payoutPhone ?? client.bankAccount}</p>
        </div>

        {/* Water balance — LIVE from SUNDA server */}
        <div className={`rounded-lg border p-4 ${isLive ? "border-emerald-300 bg-emerald-50" : "border-[#E2E8F0] bg-white"}`}>
          <p className="text-xs text-slate-500">
            Water balance (L){isLive && <span className="ml-1 text-emerald-600">● live</span>}
          </p>
          <p className="mt-1 text-xl font-semibold tabnum text-slate-900">
            {liveWaterBalance !== null
              ? `${liveWaterBalance.toLocaleString("en-US")} L`
              : "—"}
          </p>
          {liveUpdatedAt && (
            <p className="text-xs text-slate-400">
              Updated: {new Date(liveUpdatedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
            </p>
          )}
        </div>

        <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
          <p className="text-xs text-slate-500">Loan balance (all contracts)</p>
          <p className="mt-1 text-xl font-semibold tabnum text-amber-700">{fmt(loanBalance)}</p>
        </div>
      </div>

      {/* FY summary (mock) */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
          <p className="text-xs text-slate-500">Collection total (FY)</p>
          <p className="mt-1 font-semibold tabnum">{fmt(fyCollection)}</p>
        </div>
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
          <p className="text-xs text-slate-500">Sunda commission registered on EFRIS (FY)</p>
          <p className="mt-1 font-semibold tabnum">{fmt(fyCommission)}</p>
        </div>
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
          <p className="text-xs text-slate-500">Initial fee balance</p>
          <p className="mt-1 font-semibold tabnum">{fmt(initFeeBalance)}</p>
        </div>
      </div>

      {/* Contracts (mock — contracts/sources/loans not yet in the API) */}
      <Card
        title="Contracts"
        action={
          <Link href="/clients/new-contract" className="rounded-md border border-[#0B4F7C] px-3 py-1 text-xs text-[#0B4F7C] hover:bg-[#E6F1FA]">
            + Add Contract
          </Link>
        }
      >
        <div className="space-y-5">
          {client.contracts.map((con) => (
            <div key={con.id} className="rounded-lg border border-slate-200 p-4">
              <div className="mb-3 flex items-center gap-3">
                <span className="font-semibold text-slate-800">{con.contractId}</span>
                <span className="text-xs text-slate-400">TIN: {con.tin}</span>
                <span className="text-xs text-slate-400">{con.activeFrom} → {con.activeTo}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm md:grid-cols-4">
                {[
                  ["Commission",              `${(con.commissionPct * 100).toFixed(0)}%`],
                  ["Monthly fee (fixed)",     fmt(con.monthlyFeeFixed)],
                  ["Monthly fee (%)",         `${(con.monthlyFeePct * 100).toFixed(0)}%`],
                  ["Maintenance fee",         con.maintenanceFeeType === "PERCENTAGE"
                    ? `${(con.maintenanceFeeValue * 100).toFixed(0)}%`
                    : con.maintenanceFeeType === "FIXED_MONTHLY"
                      ? `${fmt(con.maintenanceFeeValue)}/mo`
                      : `${fmt(con.maintenanceFeeValue)}/event`],
                  ["Bank charge",             fmt(con.bankChargePerPayout)],
                  ["Initial fee instalment",  fmt(con.initialFeeInstallment)],
                  ["Initial fee balance",     fmt(con.initialFeeBalance)],
                  ["Monthly fee balance",     fmt(con.monthlyFeeBalance)],
                ].map(([k, v]) => (
                  <div key={k}><span className="text-slate-500">{k}: </span><span className="font-medium">{v}</span></div>
                ))}
              </div>

              {con.sources.length > 0 && (
                <div className="mt-3">
                  <p className="mb-1 text-xs font-semibold uppercase text-slate-400">Sources (from SUNDA main server)</p>
                  <div className="flex flex-wrap gap-2">
                    {con.sources.map((s) => (
                      <span key={s.id} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                        {s.name} <span className="text-slate-400">({s.sourceId})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {con.unitLoan && (
                <div className="mt-4 rounded-md bg-[#E6F1FA] p-3">
                  <p className="mb-2 text-xs font-semibold text-[#0B4F7C]">Unit loan — {con.unitLoan.unitType}</p>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm md:grid-cols-4">
                    {[
                      ["Principal",     fmt(con.unitLoan.totalPurchaseAmount)],
                      ["Outstanding",   fmt(con.unitLoan.balance)],
                      ["Monthly repay", fmt(con.unitLoan.monthlyRepayAmount)],
                      ["Due date",      con.unitLoan.dueDate],
                      ["Period",        `${con.unitLoan.paymentPeriod} months`],
                      ["Status",        con.unitLoan.status],
                    ].map(([k, v]) => (
                      <div key={k}><span className="text-slate-500">{k}: </span><span className="font-medium">{v}</span></div>
                    ))}
                  </div>
                  <table className="mt-3 w-full text-xs">
                    <thead>
                      <tr className="text-slate-500">
                        <th className="pb-1 text-left">Date</th><th className="pb-1 text-left">Kind</th>
                        <th className="pb-1 text-right">Amount</th><th className="pb-1 text-right">Balance after</th>
                        <th className="pb-1 text-left pl-2">Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {con.unitLoan.entries.map((e) => (
                        <tr key={e.id} className="border-t border-blue-100">
                          <td className="py-1">{e.createdAt}</td>
                          <td className="py-1 capitalize">{e.kind}</td>
                          <td className="py-1 text-right tabnum"><Money v={e.amount} /></td>
                          <td className="py-1 text-right tabnum"><Money v={e.balanceAfter} /></td>
                          <td className="py-1 pl-2 text-slate-400">{e.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Manual reload form — calls [B] users/manual-reload via /api/sunda/reload */}
      <Card title="Register manual water reload on SUNDA main server">
        <p className="mb-3 text-sm text-slate-500">
          Registers a water sale directly on the SUNDA main server. This creates the collection
          record that feeds reconciliation against Yo!Uganda.
          Uses the live <code className="rounded bg-slate-100 px-1 text-xs">/api/v001/users/manual-reload</code> endpoint.
        </p>
        <ManualReloadForm paymentId={paymentId} />
      </Card>

      {/* Payout history (mock) */}
      {calcs.length > 0 && (
        <Card title="Payout history">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500">
                <th className="pb-1 text-left">Period</th>
                <th className="pb-1 text-right">Gross</th><th className="pb-1 text-right">Commission</th>
                <th className="pb-1 text-right">Loan repay</th><th className="pb-1 text-right">Net</th>
                <th className="pb-1 text-left pl-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {calcs.map((c) => (
                <tr key={c.id} className="border-t border-slate-100">
                  <td className="py-1.5">{c.period}</td>
                  <td className="py-1.5 text-right tabnum"><Money v={c.gross} /></td>
                  <td className="py-1.5 text-right tabnum"><Money v={c.commission} /></td>
                  <td className="py-1.5 text-right tabnum"><Money v={c.loanRepay} /></td>
                  <td className="py-1.5 text-right tabnum font-semibold text-[#0B4F7C]"><Money v={c.net} /></td>
                  <td className="py-1.5 pl-2"><Pill s={c.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
