import { USERS, CLIENTS, REPORT_FORMATS } from "@/lib/mock";
import { Pill, Card, PageHeader } from "@/components/ui";

// SAD §10.2 role matrix
const ROLE_MATRIX: Record<string, { action: string; admin: boolean; accountant: boolean; approver: boolean; viewer: boolean }[]> = {
  "Core access": [
    { action: "Sign in with MFA; view dashboard, clients, loans, reports", admin: true, accountant: true, approver: true, viewer: true },
    { action: "Export Excel / PDF", admin: true, accountant: true, approver: true, viewer: true },
  ],
  "Client & contract management": [
    { action: "Create / edit clients, contracts, sources", admin: true, accountant: true, approver: false, viewer: false },
    { action: "Register manual payments", admin: true, accountant: true, approver: false, viewer: false },
  ],
  "Payout operations": [
    { action: "Review payout, edit manual fields, submit for approval", admin: true, accountant: true, approver: false, viewer: false },
    { action: "Mark transferred; register on EFRIS", admin: true, accountant: true, approver: false, viewer: false },
    { action: "Confirm or reject payout requests (S11)", admin: false, accountant: true, approver: false, viewer: false },
  ],
  "Approvals": [
    { action: "Approve / reject payouts, payout requests, sales", admin: true, accountant: false, approver: true, viewer: false },
  ],
  "Administration": [
    { action: "Create users, change roles, edit rules and report formats", admin: true, accountant: false, approver: false, viewer: false },
    { action: "View audit log", admin: true, accountant: false, approver: true, viewer: false },
  ],
};

const AUDIT_LOG = [
  { id: "al-1", actor: "maiki", action: "Submitted payout cycle for approval", object: "PayoutCycle / Sep 2026",  at: "2026-10-02 09:15" },
  { id: "al-2", actor: "aya",   action: "Approved loan adjustment",            object: "UnitLoan / loan-1",       at: "2026-08-15 14:30" },
  { id: "al-3", actor: "maiki", action: "Registered EFRIS submission",         object: "Commission / Aug 2026",   at: "2026-09-03 10:05" },
  { id: "al-4", actor: "aya",   action: "Approved payout cycle",               object: "PayoutCycle / Aug 2026",  at: "2026-09-02 11:20" },
  { id: "al-5", actor: "admin", action: "Created user account",                object: "User / viewer1",          at: "2026-07-01 08:00" },
  { id: "al-6", actor: "maiki", action: "Ran reconciliation",                  object: "Period / Sep 2026",       at: "2026-10-01 07:05" },
  { id: "al-7", actor: "maiki", action: "Exported report (Excel)",             object: "Report / CON-1001 Sep 2026", at: "2026-10-03 09:30" },
];

export default function UsersPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Users, roles & audit"
        sub="SAD §10.2 role matrix · accounts created by Admin only · no self-registration"
        action={
          <button className="rounded-md bg-[#0B4F7C] px-4 py-2 text-sm font-medium text-white hover:bg-[#0a4570]">
            + Add user
          </button>
        }
      />

      {/* SAD §10.2 full role matrix */}
      <Card title="Role capability matrix (SAD §10.2)">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase text-slate-500">
                <th className="border-b border-[#E2E8F0] px-3 py-2.5 text-left">Function</th>
                <th className="border-b border-[#E2E8F0] px-3 py-2.5 text-center">Admin</th>
                <th className="border-b border-[#E2E8F0] px-3 py-2.5 text-center">Accountant</th>
                <th className="border-b border-[#E2E8F0] px-3 py-2.5 text-center">Approver</th>
                <th className="border-b border-[#E2E8F0] px-3 py-2.5 text-center">Viewer</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(ROLE_MATRIX).map(([group, rows]) => (
                <>
                  <tr key={group}>
                    <td colSpan={5} className="bg-slate-100 px-3 py-1.5 text-xs font-semibold uppercase text-slate-500">
                      {group}
                    </td>
                  </tr>
                  {rows.map((r) => (
                    <tr key={r.action} className="hover:bg-slate-50">
                      <td className="border-b border-slate-100 px-3 py-2">{r.action}</td>
                      {([r.admin, r.accountant, r.approver, r.viewer] as boolean[]).map((v, i) => (
                        <td key={i} className="border-b border-slate-100 px-3 py-2 text-center">
                          {v
                            ? <span className="text-emerald-600 font-bold">✓</span>
                            : <span className="text-slate-300">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          SAD §10.2 note: maker and checker must be different people even if both hold approval rights.
          Approver cannot approve their own submissions.
        </p>
      </Card>

      {/* User list */}
      <Card title="User list">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase text-slate-500">
                {["Username","Role","Status","Last login","Actions"].map((h) => (
                  <th key={h} className="border-b border-[#E2E8F0] px-3 py-2.5 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {USERS.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="border-b border-slate-100 px-3 py-2.5 font-medium">{u.username}</td>
                  <td className="border-b border-slate-100 px-3 py-2.5"><Pill s={u.role} /></td>
                  <td className="border-b border-slate-100 px-3 py-2.5"><Pill s={u.status} /></td>
                  <td className="border-b border-slate-100 px-3 py-2.5 text-xs text-slate-400">
                    {new Date(u.lastLogin).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2.5">
                    <div className="flex gap-1">
                      <button className="rounded border border-slate-300 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-50">Edit</button>
                      {u.status === "ACTIVE"
                        ? <button className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-600 hover:bg-red-50">Deactivate</button>
                        : <button className="rounded border border-emerald-200 px-2 py-0.5 text-xs text-emerald-600 hover:bg-emerald-50">Activate</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Report format management (SAD §6.5) */}
      <Card title="Report formats (SAD §6.5)">
        <p className="mb-3 text-sm text-slate-500">
          Versioned report formats. Assign a format to each client here; the format controls which
          elements appear in the monthly Transfer Details report.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase text-slate-500">
                <th className="border-b border-[#E2E8F0] px-3 py-2.5 text-left">Format</th>
                <th className="border-b border-[#E2E8F0] px-3 py-2.5 text-left">Elements</th>
                <th className="border-b border-[#E2E8F0] px-3 py-2.5 text-left">Output</th>
                <th className="border-b border-[#E2E8F0] px-3 py-2.5 text-center">Clients</th>
                <th className="border-b border-[#E2E8F0] px-3 py-2.5 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {REPORT_FORMATS.map((rf) => (
                <tr key={rf.id} className="hover:bg-slate-50">
                  <td className="border-b border-slate-100 px-3 py-2.5 font-medium">{rf.name}</td>
                  <td className="border-b border-slate-100 px-3 py-2.5">
                    <span className="text-xs text-slate-500">{rf.elements.length} element{rf.elements.length > 1 ? "s" : ""}</span>
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2.5">
                    <div className="flex gap-1">
                      {rf.outputFormats.map((f) => (
                        <span key={f} className="rounded border border-slate-200 px-1.5 py-0.5 text-xs text-slate-500">{f}</span>
                      ))}
                    </div>
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2.5 text-center">{rf.assignedClients.length}</td>
                  <td className="border-b border-slate-100 px-3 py-2.5">
                    <button className="rounded border border-slate-300 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-50">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button className="mt-3 rounded-md border border-[#0B4F7C] px-3 py-1.5 text-sm text-[#0B4F7C] hover:bg-[#E6F1FA]">
          + New report format
        </button>
      </Card>

      {/* Contract term versions (SAD §5.2) */}
      <Card title="Contract term versions (SAD §5.2)">
        <p className="mb-3 text-sm text-slate-500">
          Commission terms are versioned with effective dates so a change in percentage never
          rewrites history. Overlapping periods are rejected by the system.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase text-slate-500">
                {["Client","Contract","Valid from","Valid to","Commission","Monthly fee","Maintenance","Status"].map((h) => (
                  <th key={h} className="border-b border-[#E2E8F0] px-3 py-2.5 text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CLIENTS.flatMap((cl) =>
                cl.contracts.flatMap((con) =>
                  con.termVersions.map((tv) => (
                    <tr key={tv.id} className="hover:bg-slate-50">
                      <td className="border-b border-slate-100 px-3 py-2.5">{cl.name}</td>
                      <td className="border-b border-slate-100 px-3 py-2.5 text-xs text-slate-500">{con.contractId}</td>
                      <td className="border-b border-slate-100 px-3 py-2.5 text-xs whitespace-nowrap">{tv.validFrom}</td>
                      <td className="border-b border-slate-100 px-3 py-2.5 text-xs whitespace-nowrap">{tv.validTo ?? "—"}</td>
                      <td className="border-b border-slate-100 px-3 py-2.5 tabnum">{(tv.commissionPct * 100).toFixed(0)}%</td>
                      <td className="border-b border-slate-100 px-3 py-2.5 tabnum">
                        {tv.monthlyFeeFixed > 0 ? `${(tv.monthlyFeeFixed / 1000).toFixed(0)}k` : "—"}
                        {tv.monthlyFeePct > 0 ? ` + ${(tv.monthlyFeePct * 100).toFixed(0)}%` : ""}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-2.5 text-xs text-slate-500">
                        {tv.maintenanceFeeType === "PERCENTAGE"
                          ? `${(tv.maintenanceFeeValue * 100).toFixed(0)}%`
                          : tv.maintenanceFeeType === "FIXED_MONTHLY"
                            ? `${(tv.maintenanceFeeValue / 1000).toFixed(0)}k/mo`
                            : `${(tv.maintenanceFeeValue / 1000).toFixed(0)}k/event`}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-2.5">
                        <Pill s={tv.validTo === null ? "ACTIVE" : "INACTIVE"} />
                      </td>
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Audit log */}
      <Card title="Audit log (SAD §3.5 Audit Trail module)">
        <div className="mb-3 flex flex-wrap gap-2">
          <input className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-[#0B4F7C] focus:outline-none" placeholder="Filter by actor…" />
          <input className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-[#0B4F7C] focus:outline-none" placeholder="Filter by action…" />
          <button className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">Export</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase text-slate-500">
                {["Actor","Action","Object","Date / time EAT"].map((h) => (
                  <th key={h} className="border-b border-[#E2E8F0] px-3 py-2.5 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {AUDIT_LOG.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="border-b border-slate-100 px-3 py-2.5 font-medium">{e.actor}</td>
                  <td className="border-b border-slate-100 px-3 py-2.5 text-slate-600">{e.action}</td>
                  <td className="border-b border-slate-100 px-3 py-2.5 text-xs text-slate-500">{e.object}</td>
                  <td className="border-b border-slate-100 px-3 py-2.5 text-xs text-slate-400 whitespace-nowrap">{e.at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-400">SAD §3.5: audit rows are append-only and cannot be edited or deleted through the application.</p>
      </Card>
    </div>
  );
}
