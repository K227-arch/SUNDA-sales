import { APPROVALS } from "@/lib/mock";
import { Pill, Card, PageHeader, InfoBanner } from "@/components/ui";

export default function ApprovalsPage() {
  const pending  = APPROVALS.filter((a) => a.status === "pending").length;
  const approved = APPROVALS.filter((a) => a.status === "approved").length;
  const rejected = APPROVALS.filter((a) => a.status === "rejected").length;

  return (
    <div className="space-y-5">
      <PageHeader title="Approvals" sub="Only Approver / Admin accounts can approve. Makers cannot approve their own work." />

      <div className="grid grid-cols-3 gap-3">
        {[{ label:"Pending",v:pending,color:"text-amber-600"},{label:"Approved",v:approved,color:"text-emerald-600"},{label:"Rejected",v:rejected,color:"text-red-600"}].map((s)=>(
          <div key={s.label} className="rounded-lg border border-[#E2E8F0] bg-white p-3 sm:p-4">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className={`mt-1 text-2xl font-semibold ${s.color}`}>{s.v}</p>
          </div>
        ))}
      </div>

      <InfoBanner>
        <strong>Role rule:</strong> Only Approver/Admin (Aya) can approve. Accountant (Maiki) submits.
        Rejection requires a reason.
      </InfoBanner>

      {/* Mobile: card list */}
      <div className="space-y-3 sm:hidden">
        {APPROVALS.map((a) => (
          <div key={a.id} className={`rounded-lg border bg-white p-4 ${a.status==="pending"?"border-amber-200 bg-amber-50/30":"border-[#E2E8F0]"}`}>
            <div className="flex items-start justify-between gap-2">
              <div><Pill s={a.type} /><p className="mt-1 text-xs text-slate-500">{a.objectRef}</p></div>
              <Pill s={a.status} />
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Submitted by <strong>{a.maker}</strong> · {a.createdAt}
            </div>
            {a.status === "pending" && (
              <div className="mt-2 flex gap-2">
                <button className="rounded bg-emerald-600 px-3 py-1 text-xs text-white">Approve</button>
                <button className="rounded bg-red-100 px-3 py-1 text-xs text-red-700">Reject</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Table (sm+) */}
      <Card title="Approval queue">
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase text-slate-500">
                {["Type","Object","Submitted by","Checked by","Status","Date","Action"].map((h)=>(
                  <th key={h} className="border-b border-[#E2E8F0] px-3 py-2.5 text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {APPROVALS.map((a) => (
                <tr key={a.id} className={`hover:bg-slate-50 ${a.status==="pending"?"bg-amber-50/30":""}`}>
                  <td className="border-b border-slate-100 px-3 py-2.5"><Pill s={a.type} /></td>
                  <td className="border-b border-slate-100 px-3 py-2.5 text-xs text-slate-600">{a.objectRef}</td>
                  <td className="border-b border-slate-100 px-3 py-2.5">{a.maker}</td>
                  <td className="border-b border-slate-100 px-3 py-2.5 text-slate-400">{a.checker ?? "—"}</td>
                  <td className="border-b border-slate-100 px-3 py-2.5"><Pill s={a.status} /></td>
                  <td className="border-b border-slate-100 px-3 py-2.5 text-xs text-slate-400 whitespace-nowrap">{a.createdAt}</td>
                  <td className="border-b border-slate-100 px-3 py-2.5">
                    {a.status==="pending"
                      ? <div className="flex gap-1"><button className="rounded bg-emerald-600 px-2 py-0.5 text-xs text-white">Approve</button><button className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">Reject</button></div>
                      : <span className="text-xs text-slate-300">—</span>}
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
