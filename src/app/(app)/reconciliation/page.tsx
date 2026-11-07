import { RECON_MATCHES, RECON_CLIENT_TOTALS } from "@/lib/mock";
import { Pill, Card, PageHeader, Money, WarnBanner } from "@/components/ui";

export default function ReconciliationPage() {
  const counts = {
    matched:     RECON_MATCHES.filter((r) => r.type === "matched").length,
    mismatch:    RECON_MATCHES.filter((r) => r.type === "mismatch").length,
    yo_only:     RECON_MATCHES.filter((r) => r.type === "yo_only").length,
    server_only: RECON_MATCHES.filter((r) => r.type === "server_only").length,
    open:        RECON_MATCHES.filter((r) => r.status === "open").length,
  };

  const SUMMARY = [
    { label: "Matched",                 v: counts.matched,     color: "text-emerald-600" },
    { label: "Mismatch",                v: counts.mismatch,    color: "text-amber-600"   },
    { label: "Yo!Uganda only",          v: counts.yo_only,     color: "text-blue-600"    },
    { label: "SUNDA server only",       v: counts.server_only, color: "text-indigo-600"  },
    { label: "Open / needs escalation", v: counts.open,        color: "text-red-600"     },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reconciliation — Sep 2026"
        sub="SAD §7.4: Yo!Uganda vs SUNDA main server — totals, counts and attribute-level comparison"
        action={
          <div className="flex gap-2">
            <button className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
              Export for email
            </button>
            <button className="rounded-md bg-[#0B4F7C] px-3 py-2 text-sm font-medium text-white hover:bg-[#0a4570]">
              Run reconciliation
            </button>
          </div>
        }
      />

      {/* Count cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {SUMMARY.map((s) => (
          <div key={s.label} className="rounded-lg border border-[#E2E8F0] bg-white p-3 sm:p-4">
            <p className="text-xs text-slate-500 leading-tight">{s.label}</p>
            <p className={`mt-1 text-2xl font-semibold ${s.color}`}>{s.v}</p>
          </div>
        ))}
      </div>

      <WarnBanner>
        <strong>SAD §7.4 — out-of-system resolution:</strong> discrepancies are escalated by email
        to Yo!Uganda / the Japanese software company. Sunda does not correct data itself.
        Use <strong>Export for email</strong> to generate the list.
      </WarnBanner>

      {/* Per-client totals (SAD §7.4) */}
      <Card title="Per-client totals comparison (SAD §7.4)">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase text-slate-500">
                {["Client","Yo! total","Server total","Difference","Yo! count","Server count","Status"].map((h) => (
                  <th key={h} className="border-b border-[#E2E8F0] px-3 py-2.5 text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RECON_CLIENT_TOTALS.map((r) => (
                <tr key={r.clientId} className={`hover:bg-slate-50 ${r.diff !== 0 ? "bg-amber-50/30" : ""}`}>
                  <td className="border-b border-slate-100 px-3 py-2.5 font-medium">{r.clientName}</td>
                  <td className="border-b border-slate-100 px-3 py-2.5 text-right tabnum"><Money v={r.yoTotal} /></td>
                  <td className="border-b border-slate-100 px-3 py-2.5 text-right tabnum"><Money v={r.serverTotal} /></td>
                  <td className={`border-b border-slate-100 px-3 py-2.5 text-right tabnum font-semibold ${r.diff !== 0 ? "text-amber-600" : "text-emerald-600"}`}>
                    {r.diff !== 0 ? <Money v={r.diff} /> : "✓ Match"}
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2.5 text-center">{r.txnCountYo}</td>
                  <td className="border-b border-slate-100 px-3 py-2.5 text-center">{r.txnCountServer}</td>
                  <td className="border-b border-slate-100 px-3 py-2.5">
                    <Pill s={r.diff !== 0 || r.txnCountYo !== r.txnCountServer ? "open" : "resolved"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Transaction-level attribute comparison (SAD §8.3) */}
      <Card title="Transaction-level attribute comparison (SAD §8.3)">
        <p className="mb-3 text-xs text-slate-500">
          SAD §8.3 fields: Transaction ID, Operator, Operator Ref, Sender MSISDN, Reference.
          Differences highlighted — export this list for email escalation.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase text-slate-500">
                {["Type","Status","Client","Source","Txn ID","Operator","Operator ref","Sender","Yo! amount","Server amount","Diff","Date","Mismatch reasons"].map((h) => (
                  <th key={h} className="border-b border-[#E2E8F0] px-3 py-2.5 text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RECON_MATCHES.map((m) => (
                <tr key={m.id} className={`hover:bg-slate-50 ${m.status === "open" ? "bg-amber-50/30" : ""}`}>
                  <td className="border-b border-slate-100 px-3 py-2.5"><Pill s={m.type} /></td>
                  <td className="border-b border-slate-100 px-3 py-2.5"><Pill s={m.status} /></td>
                  <td className="border-b border-slate-100 px-3 py-2.5 max-w-[100px] truncate">{m.clientName}</td>
                  <td className="border-b border-slate-100 px-3 py-2.5 text-xs text-slate-500 whitespace-nowrap">{m.sourceName}</td>
                  <td className="border-b border-slate-100 px-3 py-2.5 text-xs font-mono text-slate-500 whitespace-nowrap">
                    {m.txnId ?? <span className="text-slate-300">—</span>}
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2.5 text-xs text-slate-500 whitespace-nowrap">
                    {m.operator ?? <span className="text-slate-300">—</span>}
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2.5 text-xs font-mono text-slate-500 whitespace-nowrap">
                    {m.operatorRef ?? <span className="text-slate-300">—</span>}
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2.5 text-xs text-slate-500 whitespace-nowrap">
                    {m.senderMsisdn ?? <span className="text-slate-300">—</span>}
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2.5 text-right tabnum">
                    {m.yoAmount !== null ? <Money v={m.yoAmount} /> : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2.5 text-right tabnum">
                    {m.serverAmount !== null ? <Money v={m.serverAmount} /> : <span className="text-slate-300">—</span>}
                  </td>
                  <td className={`border-b border-slate-100 px-3 py-2.5 text-right tabnum font-medium ${m.diff !== 0 ? "text-amber-600" : "text-slate-300"}`}>
                    {m.diff !== 0 ? <Money v={m.diff} /> : "—"}
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2.5 text-xs text-slate-400 whitespace-nowrap">{m.occurredAt}</td>
                  <td className="border-b border-slate-100 px-3 py-2.5">
                    {m.mismatchReasons.length > 0
                      ? <div className="flex flex-wrap gap-1">
                          {m.mismatchReasons.map((r) => (
                            <span key={r} className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700 whitespace-nowrap">
                              {r.replace(/_/g," ")}
                            </span>
                          ))}
                        </div>
                      : <span className="text-xs text-emerald-600">✓</span>}
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
