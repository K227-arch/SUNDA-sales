import { PAYOUT_REQUESTS, PAYOUT_CYCLE } from "@/lib/mock";
import { Pill, Card, PageHeader, Money, InfoBanner } from "@/components/ui";

export default function PayoutRequestsPage() {
  const allowedMap: Record<string, number> = {};
  for (const calc of PAYOUT_CYCLE.calcs)
    allowedMap[calc.clientId] = (allowedMap[calc.clientId] ?? 0) + (calc.gross - calc.commission);

  return (
    <div className="space-y-5">
      <PageHeader title="Payout requests" sub="Mid-month liquidation requests from clients via the mobile app" />

      <InfoBanner>
        <strong>Mobile app rule:</strong> the app blocks requests above collection minus commission.
        Accountant reviews here, Approver confirms before transfer.
      </InfoBanner>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["pending","approved","rejected","transferred"] as const).map((s) => (
          <div key={s} className="rounded-lg border border-[#E2E8F0] bg-white p-3 sm:p-4">
            <p className="text-xs capitalize text-slate-500">{s}</p>
            <p className="mt-1 text-2xl font-semibold">{PAYOUT_REQUESTS.filter((r) => r.status === s).length}</p>
          </div>
        ))}
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 sm:hidden">
        {PAYOUT_REQUESTS.map((r) => {
          const allowed   = allowedMap[r.clientId] ?? 0;
          const overLimit = r.requestedAmount > allowed;
          return (
            <div key={r.id} className="rounded-lg border border-[#E2E8F0] bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{r.clientName}</p>
                  <p className="text-xs text-slate-400">{r.contractRef} · {r.period}</p>
                </div>
                <Pill s={r.status} />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                <span><span className="text-slate-400">Requested: </span><span className={overLimit?"text-red-600 font-medium":""}><Money v={r.requestedAmount} /></span></span>
                <span><span className="text-slate-400">Max allowed: </span><Money v={allowed} /></span>
              </div>
              {r.reason && <p className="mt-1 text-xs text-slate-500">{r.reason}</p>}
              {r.status === "pending" && (
                <div className="mt-2 flex gap-2">
                  <button className="rounded bg-[#0B4F7C] px-3 py-1 text-xs text-white">Review</button>
                  <button className="rounded bg-red-100 px-3 py-1 text-xs text-red-700">Reject</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Table (sm+) */}
      <Card title="Liquidation requests">
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase text-slate-500">
                {["Client","Contract","Period","Requested","Max allowed","Status","Reason","Date","Action"].map((h) => (
                  <th key={h} className="border-b border-[#E2E8F0] px-3 py-2.5 text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PAYOUT_REQUESTS.map((r) => {
                const allowed = allowedMap[r.clientId] ?? 0;
                const overLimit = r.requestedAmount > allowed;
                return (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="border-b border-slate-100 px-3 py-2.5 font-medium whitespace-nowrap">{r.clientName}</td>
                    <td className="border-b border-slate-100 px-3 py-2.5 text-xs text-slate-500 whitespace-nowrap">{r.contractRef}</td>
                    <td className="border-b border-slate-100 px-3 py-2.5 text-slate-500 whitespace-nowrap">{r.period}</td>
                    <td className={`border-b border-slate-100 px-3 py-2.5 tabnum font-medium ${overLimit?"text-red-600":""}`}><Money v={r.requestedAmount} /></td>
                    <td className="border-b border-slate-100 px-3 py-2.5 tabnum text-slate-400"><Money v={allowed} /></td>
                    <td className="border-b border-slate-100 px-3 py-2.5"><Pill s={r.status} /></td>
                    <td className="border-b border-slate-100 px-3 py-2.5 text-xs text-slate-400">{r.reason ?? "—"}</td>
                    <td className="border-b border-slate-100 px-3 py-2.5 text-xs text-slate-400 whitespace-nowrap">{r.createdAt}</td>
                    <td className="border-b border-slate-100 px-3 py-2.5">
                      {r.status==="pending"
                        ? <div className="flex gap-1"><button className="rounded bg-[#0B4F7C] px-2 py-0.5 text-xs text-white">Review</button><button className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">Reject</button></div>
                        : r.status==="approved"
                          ? <button className="rounded bg-emerald-600 px-2 py-0.5 text-xs text-white">Transfer</button>
                          : <span className="text-xs text-slate-300">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
