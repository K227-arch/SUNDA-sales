import { EFRIS_SUBMISSIONS, SALES_RECORDS, PAYOUT_CYCLE } from "@/lib/mock";
import type { CommissionCategory } from "@/lib/mock";
import { Pill, Card, PageHeader, Money, fmt } from "@/components/ui";

const CAT_LABEL: Record<CommissionCategory, string> = {
  INITIAL_FEE:         "Initial fee",
  MONTHLY_FEE:         "Monthly fee",
  ADDITIONAL_TRANSFER: "Additional transfer",
  MAINTENANCE_FEE:     "Maintenance fee",
  BANK_CHARGE:         "Bank charge",
};

const CAT_COLOR: Record<CommissionCategory, string> = {
  INITIAL_FEE:         "bg-blue-100 text-blue-700",
  MONTHLY_FEE:         "bg-indigo-100 text-indigo-700",
  ADDITIONAL_TRANSFER: "bg-purple-100 text-purple-700",
  MAINTENANCE_FEE:     "bg-amber-100 text-amber-700",
  BANK_CHARGE:         "bg-slate-100 text-slate-600",
};

export default function EfrisPage() {
  // SAD §7.3: commission broken down by category
  const categories: CommissionCategory[] = [
    "INITIAL_FEE","MONTHLY_FEE","ADDITIONAL_TRANSFER","MAINTENANCE_FEE","BANK_CHARGE",
  ];

  const byCat = categories.map((cat) => ({
    cat,
    records: SALES_RECORDS.filter((r) => r.category === cat),
    total: SALES_RECORDS.filter((r) => r.category === cat).reduce((a, r) => a + r.amount, 0),
  }));

  const sep26Total = SALES_RECORDS.filter((r) => r.period === "2026-09").reduce((a, r) => a + r.amount, 0);
  const pendingApproval = SALES_RECORDS.filter((r) => r.status === "pending" || r.status === "approval_requested").length;
  const efrisRegistered = SALES_RECORDS.filter((r) => r.status === "efris_registered").reduce((a, r) => a + r.amount, 0);

  // EFRIS submission status counts
  const efrisCounts = {
    ready: EFRIS_SUBMISSIONS.filter((s) => s.status === "ready").length,
    submitted: EFRIS_SUBMISSIONS.filter((s) => s.status === "submitted").length,
    approved: EFRIS_SUBMISSIONS.filter((s) => s.status === "approved").length,
    rejected: EFRIS_SUBMISSIONS.filter((s) => s.status === "rejected").length,
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="EFRIS — Sales registration"
        sub="SAD §7.3: Sunda commission categorised by component type, then registered as EFRIS sales"
        action={
          <button className="rounded-md bg-[#0B4F7C] px-3 py-2 text-sm font-medium text-white hover:bg-[#0a4570]">
            Register EFRIS (selected)
          </button>
        }
      />

      {/* Workflow explanation (SAD §7.3) */}
      <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
        <strong>SAD §7.3 workflow:</strong>{" "}
        After month end → Accountant reviews and confirms per category →
        Approver approves → Accountant registers on EFRIS (manual first, API later) →
        records invoice number and PDF → status becomes <em>EFRIS registered</em>.
        The dashboard bar chart updates once registered.
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
          <p className="text-xs text-slate-500">Sep 2026 total commission</p>
          <p className="mt-1 text-xl font-semibold tabnum">{fmt(sep26Total)}</p>
        </div>
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
          <p className="text-xs text-slate-500">Pending approval</p>
          <p className="mt-1 text-2xl font-semibold text-amber-600">{pendingApproval}</p>
        </div>
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
          <p className="text-xs text-slate-500">Already EFRIS registered (Aug)</p>
          <p className="mt-1 text-xl font-semibold tabnum text-emerald-600">{fmt(efrisRegistered)}</p>
        </div>
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
          <p className="text-xs text-slate-500">Ready to register</p>
          <p className="mt-1 text-2xl font-semibold text-[#0B4F7C]">{efrisCounts.ready}</p>
        </div>
      </div>

      {/* SAD §2.2 — commission by category */}
      <Card title="Sep 2026 — Sunda commission by category (SAD §2.2)">
        <p className="mb-4 text-xs text-slate-500">
          Each category is a separate commission component that must be registered on EFRIS as sales.
          Applies to client: ASP / Private water vendor / Water vendor per SAD §2.2.
        </p>
        <div className="space-y-4">
          {byCat.filter((b) => b.records.length > 0).map((b) => (
            <div key={b.cat} className="rounded-lg border border-[#E2E8F0] p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${CAT_COLOR[b.cat]}`}>
                  {CAT_LABEL[b.cat]}
                </span>
                <span className="tabnum text-sm font-semibold">{fmt(b.total)}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-slate-500">
                      <th className="pb-1 text-left">Client</th>
                      <th className="pb-1 text-left">Contract</th>
                      <th className="pb-1 text-right">Amount</th>
                      <th className="pb-1 text-left pl-2">Status</th>
                      <th className="pb-1 text-left pl-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {b.records.map((r) => (
                      <tr key={r.id} className="border-t border-slate-100">
                        <td className="py-1.5 pr-3 whitespace-nowrap">{r.clientName}</td>
                        <td className="py-1.5 pr-3 text-xs text-slate-500 whitespace-nowrap">{r.contractRef}</td>
                        <td className="py-1.5 pr-3 text-right tabnum font-medium"><Money v={r.amount} /></td>
                        <td className="py-1.5 pl-2">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap
                            ${r.status === "efris_registered" ? "bg-emerald-100 text-emerald-700"
                              : r.status === "approved"        ? "bg-blue-100 text-blue-700"
                              : r.status === "rejected"        ? "bg-red-100 text-red-700"
                              : r.status === "approval_requested" ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-500"}`}>
                            {r.status.replace(/_/g," ")}
                          </span>
                        </td>
                        <td className="py-1.5 pl-2">
                          {r.status === "pending" && (
                            <button className="rounded bg-[#0B4F7C] px-2 py-0.5 text-xs text-white">Request approval</button>
                          )}
                          {r.status === "approval_requested" && (
                            <span className="text-xs text-slate-400">Awaiting approver</span>
                          )}
                          {r.status === "approved" && (
                            <button className="rounded bg-emerald-600 px-2 py-0.5 text-xs text-white">Register on EFRIS</button>
                          )}
                          {r.status === "efris_registered" && r.invoiceNumber && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-slate-500">{r.invoiceNumber}</span>
                              <button className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">PDF</button>
                            </div>
                          )}
                          {r.status === "rejected" && (
                            <button className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700">Resubmit</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* EFRIS submission tracking */}
      <Card title="EFRIS submission tracking">
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(["ready","submitted","approved","rejected"] as const).map((k) => (
            <div key={k} className="rounded-lg border border-[#E2E8F0] bg-white p-3">
              <p className="text-xs capitalize text-slate-500">{k}</p>
              <p className={`mt-1 text-2xl font-semibold
                ${k==="ready"?"text-amber-600":k==="approved"?"text-emerald-600":k==="rejected"?"text-red-600":"text-blue-600"}`}>
                {efrisCounts[k]}
              </p>
            </div>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase text-slate-500">
                {["","Type","Client","Contract","Period","Amount","Status","EFRIS ref","Invoice","Attempts","Action"].map((h) => (
                  <th key={h} className="border-b border-[#E2E8F0] px-3 py-2.5 text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {EFRIS_SUBMISSIONS.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="border-b border-slate-100 px-3 py-2.5">
                    {s.status === "ready" && <input type="checkbox" className="rounded border-slate-300" />}
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2.5 text-xs whitespace-nowrap">{s.recordType.replace("_"," ")}</td>
                  <td className="border-b border-slate-100 px-3 py-2.5 whitespace-nowrap">{s.clientName}</td>
                  <td className="border-b border-slate-100 px-3 py-2.5 text-xs text-slate-500 whitespace-nowrap">{s.contractRef}</td>
                  <td className="border-b border-slate-100 px-3 py-2.5 text-slate-500 whitespace-nowrap">{s.period}</td>
                  <td className="border-b border-slate-100 px-3 py-2.5 tabnum"><Money v={s.amount} /></td>
                  <td className="border-b border-slate-100 px-3 py-2.5"><Pill s={s.status} /></td>
                  <td className="border-b border-slate-100 px-3 py-2.5 text-xs text-slate-400">{s.efrisRef ?? "—"}</td>
                  <td className="border-b border-slate-100 px-3 py-2.5 text-xs text-slate-400">{s.invoiceNumber ?? "—"}</td>
                  <td className="border-b border-slate-100 px-3 py-2.5 text-center">{s.attempts}</td>
                  <td className="border-b border-slate-100 px-3 py-2.5">
                    {s.status==="ready"     && <button className="rounded bg-[#0B4F7C] px-2 py-0.5 text-xs text-white">Register</button>}
                    {s.status==="rejected"  && <button className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700">Resubmit</button>}
                    {s.status==="approved"  && <button className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">Download PDF</button>}
                    {s.status==="submitted" && <span className="text-xs text-slate-400">Pending…</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
