import { CLIENTS, REPORT_FORMATS } from "@/lib/mock";
import { Card, PageHeader, fmt } from "@/components/ui";

// SAD §9.1 S15 — five report categories with their exact line items
const REPORT_DEFS = [
  {
    id: "R1", label: "1. Water collection & maintenance",
    recipient: "Kiryandongo / UNICEF",
    applies: "UNICEF-funded projects",
    sad: "SAD §9.1 S15, §6.5",
    items: [
      "Total water fee collection per source",
      "Payment record (from community people)",
      "Maintenance expenses",
      "Maintenance record",
    ],
    formats: ["Excel","PDF"],
  },
  {
    id: "R2", label: "2. Government report",
    recipient: "Government / DWO (Kiryandongo, Gomba district)",
    applies: "District Water Office",
    sad: "SAD §9.1 S15",
    items: [
      "Total water fee collection from each source",
      "Water fee collection from each source + α",
      "Payment record (from community people)",
    ],
    formats: ["Excel","PDF"],
  },
  {
    id: "R3", label: "3. Private water vendor report",
    recipient: "Individuals (private water vendors)",
    applies: "Private Water Vendor category",
    sad: "SAD §9.1 S15",
    items: [
      "Total water fee collection",
      "Monthly fee (percentage / amount per contract)",
      "Additional transfer in MMMM YYYY",
      "Maintenance fee (percentage / amount per contract)",
      "Bank charge",
      "Transferred amount",
      "Loan repayment record and balance list",
    ],
    formats: ["Excel","CSV","PDF"],
  },
  {
    id: "R4", label: "4. ASP report",
    recipient: "Whave, RRD and other ASPs",
    applies: "ASP category",
    sad: "SAD §9.1 S15",
    items: [
      "Total water fee collection",
      "Monthly fee (percentage / amount per contract)",
      "Additional transfer in MMMM YYYY",
      "Maintenance fee (percentage / amount per contract)",
      "Bank charge",
      "Transferred amount",
    ],
    formats: ["Excel","PDF"],
  },
  {
    id: "R5", label: "5. Water vendor — 3-month collection",
    recipient: "KO, Matoogo and quarterly-paid vendors",
    applies: "Quarterly payment frequency",
    sad: "SAD §9.1 S15 — several loans shown individually",
    items: [
      "3-month total water fee collection (multiple sources)",
      "Additional transfer in MMMM YYYY",
      "Maintenance fee (percentage / amount per contract)",
      "Bank charge",
      "Transferred amount",
      "Loan repayment record and loan balance (per agreement)",
      "All loan agreements shown separately when a client has multiple",
    ],
    formats: ["Excel","PDF"],
  },
];

// SAD §6.5 — report elements
const ELEMENT_LABEL: Record<string, string> = {
  COLLECTION:           "Monthly collection",
  TRANSFER_CALC:        "Calculation of transfer amount",
  INITIAL_FEE_BALANCE:  "Initial-fee balance calculation",
  MONTHLY_FEE_BALANCE:  "Monthly-fee balance calculation",
  LOAN_CALC:            "Loan calculation",
};

export default function ReportsPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports"
        sub="SAD §6.5 / §9.1: configurable per-client report formats. All downloads are logged."
      />

      <div className="rounded-md border border-[#E2E8F0] bg-slate-50 p-3 text-sm text-slate-600">
        <strong>SAD §6.5:</strong> a monthly "Transfer Details" report is built from up to five elements:
        monthly collection, calculation of transfer amount, initial-fee balance, monthly-fee balance and loan calculation.
        Which elements appear is set per client via the report format in Rules &amp; Settings.
        Reports are stored so past versions can be downloaded from the client&apos;s payout history.
      </div>

      {/* 5 report categories */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {REPORT_DEFS.map((r) => (
          <Card key={r.id} title={r.label}>
            <p className="mb-1 text-xs text-slate-400">Recipient: {r.recipient}</p>
            <p className="mb-2 text-xs text-slate-400">Applies to: {r.applies}</p>
            <p className="mb-2 text-xs font-mono text-slate-300">{r.sad}</p>
            <ul className="mb-4 space-y-1">
              {r.items.map((it) => (
                <li key={it} className="flex gap-2 text-sm text-slate-600">
                  <span className="mt-0.5 text-slate-300 shrink-0">•</span>{it}
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              {r.formats.map((f) => (
                <button key={f} className="rounded-md border border-[#0B4F7C] px-3 py-1 text-xs text-[#0B4F7C] hover:bg-[#E6F1FA]">
                  {f}
                </button>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Report formats configuration (SAD §6.5 — stored per client) */}
      <Card title="Report format configuration (SAD §6.5)">
        <p className="mb-3 text-sm text-slate-500">
          Each format defines which of the five elements appears in the report. Assigned per client in Rules &amp; Settings.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase text-slate-500">
                <th className="border-b border-[#E2E8F0] px-3 py-2.5 text-left">Format name</th>
                <th className="border-b border-[#E2E8F0] px-3 py-2.5 text-left">Elements included</th>
                <th className="border-b border-[#E2E8F0] px-3 py-2.5 text-left">Output</th>
                <th className="border-b border-[#E2E8F0] px-3 py-2.5 text-left">Assigned clients</th>
              </tr>
            </thead>
            <tbody>
              {REPORT_FORMATS.map((rf) => (
                <tr key={rf.id} className="hover:bg-slate-50">
                  <td className="border-b border-slate-100 px-3 py-2.5 font-medium">{rf.name}</td>
                  <td className="border-b border-slate-100 px-3 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {rf.elements.map((e) => (
                        <span key={e} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600 whitespace-nowrap">
                          {ELEMENT_LABEL[e] ?? e}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2.5">
                    <div className="flex gap-1">
                      {rf.outputFormats.map((f) => (
                        <span key={f} className="rounded border border-slate-300 px-2 py-0.5 text-xs text-slate-500">{f}</span>
                      ))}
                    </div>
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2.5 text-xs text-slate-500">
                    {rf.assignedClients.length === 0
                      ? <span className="text-slate-300">Not assigned</span>
                      : CLIENTS.filter((c) => rf.assignedClients.includes(c.id))
                          .map((c) => c.name).join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Per-client quick-generate */}
      <Card title="Generate report per client">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase text-slate-500">
                <th className="border-b border-[#E2E8F0] px-3 py-2.5 text-left">Client</th>
                <th className="border-b border-[#E2E8F0] px-3 py-2.5 text-left">Report format</th>
                <th className="border-b border-[#E2E8F0] px-3 py-2.5 text-left">Payment freq</th>
                <th className="border-b border-[#E2E8F0] px-3 py-2.5 text-left">Generate</th>
              </tr>
            </thead>
            <tbody>
              {CLIENTS.filter((c) => c.status === "ACTIVE").map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="border-b border-slate-100 px-3 py-2.5 font-medium">{c.name}</td>
                  <td className="border-b border-slate-100 px-3 py-2.5 text-slate-600">{c.reportFormat}</td>
                  <td className="border-b border-slate-100 px-3 py-2.5 text-slate-500">{c.paymentFrequency}</td>
                  <td className="border-b border-slate-100 px-3 py-2.5">
                    <div className="flex gap-1">
                      <button className="rounded bg-[#0B4F7C] px-2 py-0.5 text-xs text-white hover:bg-[#0a4570]">Excel</button>
                      <button className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-200">PDF</button>
                    </div>
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
