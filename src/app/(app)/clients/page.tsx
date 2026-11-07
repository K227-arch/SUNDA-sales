import Link from "next/link";
import { CLIENTS } from "@/lib/mock";
import { Pill, PageHeader, Card } from "@/components/ui";

export default function ClientsPage() {
  const total        = CLIENTS.length;
  const active       = CLIENTS.filter((c) => c.status === "ACTIVE").length;
  const totalSources = CLIENTS.flatMap((c) => c.sources).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Clients"
        sub={`${total} clients · ${active} active · ${totalSources} sources`}
        action={
          <Link
            href="/clients/new"
            className="rounded-md bg-[#0B4F7C] px-3 py-2 text-sm font-medium text-white hover:bg-[#0a4570]"
          >
            + Add Client
          </Link>
        }
      />

      {/* Mobile: card list; sm+: table */}
      {/* Card list (mobile) */}
      <div className="space-y-3 sm:hidden">
        {CLIENTS.map((c) => (
          <div key={c.id} className="rounded-lg border border-[#E2E8F0] bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link href={`/clients/${c.id}`} className="font-semibold text-[#0B4F7C] hover:underline">
                  {c.name}
                </Link>
                <p className="text-xs text-slate-400">{c.clientId}</p>
              </div>
              <Pill s={c.status} />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-slate-600">
              <span><span className="text-slate-400">Category: </span>{c.category}</span>
              <span><span className="text-slate-400">Transfer: </span>{c.transferMethod === "BANK" ? "Bank" : "Mobile money"}</span>
              <span><span className="text-slate-400">Contracts: </span>{c.contracts.length}</span>
              <span><span className="text-slate-400">Sources: </span>{c.sources.length}</span>
            </div>
            {c.contracts.length === 0 && (
              <p className="mt-2 text-xs text-red-600">⚠ Registration required — no active contracts</p>
            )}
          </div>
        ))}
      </div>

      {/* Table (sm+) */}
      <Card>
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase text-slate-500">
                <th className="border-b border-[#E2E8F0] px-3 py-2.5 text-left">Client</th>
                <th className="border-b border-[#E2E8F0] px-3 py-2.5 text-left">Category</th>
                <th className="border-b border-[#E2E8F0] px-3 py-2.5 text-left">Transfer</th>
                <th className="border-b border-[#E2E8F0] px-3 py-2.5 text-center">Contracts</th>
                <th className="border-b border-[#E2E8F0] px-3 py-2.5 text-center">Sources</th>
                <th className="border-b border-[#E2E8F0] px-3 py-2.5 text-left">Status</th>
                <th className="border-b border-[#E2E8F0] px-3 py-2.5 text-left">Freq</th>
              </tr>
            </thead>
            <tbody>
              {CLIENTS.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="border-b border-slate-100 px-3 py-2.5">
                    <Link href={`/clients/${c.id}`} className="font-medium text-[#0B4F7C] hover:underline">{c.name}</Link>
                    <div className="text-xs text-slate-400">{c.clientId}</div>
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2.5 text-slate-600">{c.category}</td>
                  <td className="border-b border-slate-100 px-3 py-2.5 text-xs">
                    {c.transferMethod === "BANK" ? "🏦 Bank" : "📱 Mobile money"}
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2.5 text-center">
                    {c.contracts.length === 0
                      ? <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">Required</span>
                      : c.contracts.length}
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2.5 text-center">{c.sources.length}</td>
                  <td className="border-b border-slate-100 px-3 py-2.5"><Pill s={c.status} /></td>
                  <td className="border-b border-slate-100 px-3 py-2.5 text-slate-500 text-xs">{c.paymentFrequency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
