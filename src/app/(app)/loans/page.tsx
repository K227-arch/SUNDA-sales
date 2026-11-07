import { CLIENTS } from "@/lib/mock";
import { Pill, Card, PageHeader, Money, fmt } from "@/components/ui";

export default function LoansPage() {
  const loans = CLIENTS.flatMap((cl) =>
    cl.contracts.filter((c) => c.unitLoan !== null).map((c) => ({ client: cl, contract: c, loan: c.unitLoan! }))
  );

  const totalPrincipal   = loans.reduce((a, l) => a + l.loan.totalPurchaseAmount, 0);
  const totalRepaid      = loans.reduce((a, l) => a + (l.loan.totalPurchaseAmount - l.loan.balance), 0);
  const totalOutstanding = loans.reduce((a, l) => a + l.loan.balance, 0);

  return (
    <div className="space-y-5">
      <PageHeader title="Unit loans" sub="Portfolio of all active unit loans" />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Total principal",  v: totalPrincipal,   color: "text-slate-900" },
          { label: "Repaid to date",   v: totalRepaid,      color: "text-emerald-600" },
          { label: "Outstanding",      v: totalOutstanding, color: "text-amber-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-[#E2E8F0] bg-white p-4">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className={`mt-1 text-xl font-semibold tabnum ${s.color}`}>{fmt(s.v)}</p>
          </div>
        ))}
      </div>

      <Card title="Loan portfolio">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase text-slate-500">
                {["Client","Contract","Type","Principal","Repaid","Outstanding","Monthly repay","Status","Due date"].map((h) => (
                  <th key={h} className="border-b border-[#E2E8F0] px-3 py-2.5 text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loans.map(({ client, contract, loan }) => {
                const repaid = loan.totalPurchaseAmount - loan.balance;
                const pct    = Math.round((repaid / loan.totalPurchaseAmount) * 100);
                return (
                  <tr key={loan.id} className="hover:bg-slate-50">
                    <td className="border-b border-slate-100 px-3 py-2.5 font-medium whitespace-nowrap">{client.name}</td>
                    <td className="border-b border-slate-100 px-3 py-2.5 text-xs text-slate-500 whitespace-nowrap">{contract.contractId}</td>
                    <td className="border-b border-slate-100 px-3 py-2.5">{loan.unitType}</td>
                    <td className="border-b border-slate-100 px-3 py-2.5 text-right tabnum"><Money v={loan.totalPurchaseAmount} /></td>
                    <td className="border-b border-slate-100 px-3 py-2.5 text-right tabnum text-emerald-600"><Money v={repaid} /></td>
                    <td className="border-b border-slate-100 px-3 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-slate-100 sm:block">
                          <div className="h-full rounded-full bg-amber-400" style={{ width: `${100 - pct}%` }} />
                        </div>
                        <span className="tabnum font-medium text-amber-600"><Money v={loan.balance} /></span>
                      </div>
                    </td>
                    <td className="border-b border-slate-100 px-3 py-2.5 text-right tabnum"><Money v={loan.monthlyRepayAmount} /></td>
                    <td className="border-b border-slate-100 px-3 py-2.5"><Pill s={loan.status} /></td>
                    <td className="border-b border-slate-100 px-3 py-2.5 text-xs text-slate-500 whitespace-nowrap">{loan.dueDate}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {loans.map(({ client, contract, loan }) => (
        <Card key={loan.id} title={`Ledger — ${client.name} / ${contract.contractId}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500">
                  <th className="pb-1.5 text-left whitespace-nowrap">Date</th>
                  <th className="pb-1.5 text-left">Kind</th>
                  <th className="pb-1.5 text-right whitespace-nowrap">Amount</th>
                  <th className="pb-1.5 text-right whitespace-nowrap">Balance after</th>
                  <th className="pb-1.5 pl-3 text-left">Note</th>
                </tr>
              </thead>
              <tbody>
                {loan.entries.map((e) => (
                  <tr key={e.id} className="border-t border-slate-100">
                    <td className="py-1.5 pr-3 text-slate-500 whitespace-nowrap">{e.createdAt}</td>
                    <td className="py-1.5 pr-3 capitalize">{e.kind}</td>
                    <td className={`py-1.5 text-right tabnum ${e.kind === "repayment" ? "text-emerald-600" : ""}`}><Money v={e.amount} /></td>
                    <td className="py-1.5 text-right tabnum font-medium"><Money v={e.balanceAfter} /></td>
                    <td className="py-1.5 pl-3 text-xs text-slate-400">{e.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ))}
    </div>
  );
}
