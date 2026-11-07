"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { CLIENTS } from "@/lib/mock";
import { Pill } from "@/components/ui";
import type { Client } from "@/lib/mock";

// ── Types ─────────────────────────────────────────────────────────────────────
type SortKey = "clientId" | "name" | "category" | "paymentFrequency" | "status";
type SortDir = "asc" | "desc";

// ── Helpers ───────────────────────────────────────────────────────────────────
function nextPaymentMonth(client: Client): string {
  if (!client.firstPayoutMonth) return "—";
  // Advance from firstPayoutMonth by frequency
  const [year, month] = client.firstPayoutMonth.split("-").map(Number);
  const now = new Date();
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth() + 1; // 1-indexed
  const step = client.paymentFrequency === "QUARTERLY" ? 3 : 1;

  let y = year;
  let m = month;
  // Fast-forward to the next upcoming payment from today
  while (y < nowYear || (y === nowYear && m < nowMonth)) {
    m += step;
    if (m > 12) { m -= 12; y += 1; }
  }
  return `${y}-${String(m).padStart(2, "0")}`;
}

function getActiveSources(client: Client): number {
  return client.sources.filter((s) => s.status === "ACTIVE").length;
}

function getActiveContracts(client: Client): number {
  return client.contracts.length;
}

// ── Sort chevron icon ─────────────────────────────────────────────────────────
function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="ml-1 text-slate-300 text-[10px]">⇅</span>;
  return (
    <span className="ml-1 text-[#0B4F7C] text-[10px]">{dir === "asc" ? "↑" : "↓"}</span>
  );
}

// ── Column header ─────────────────────────────────────────────────────────────
function Th({
  label, sortKey, current, dir, onSort, right,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: SortDir;
  onSort: (k: SortKey) => void;
  right?: boolean;
}) {
  return (
    <th
      onClick={() => onSort(sortKey)}
      className={`cursor-pointer select-none whitespace-nowrap border-b border-[#E2E8F0] bg-slate-50 px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.07em] text-slate-500 hover:text-slate-700 ${right ? "text-right" : "text-left"}`}
    >
      {label}
      <SortIcon active={current === sortKey} dir={dir} />
    </th>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterLoan, setFilterLoan] = useState("Any");
  const [filterStatus, setFilterStatus] = useState("Active");
  const [sortKey, setSortKey] = useState<SortKey>("clientId");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const fileRef = useRef<HTMLInputElement>(null);

  // Derived counts for subtitle
  const totalActive = CLIENTS.filter((c) => c.status === "ACTIVE").length;

  // ── Unique categories for filter dropdown ──────────────────────────────────
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(CLIENTS.map((c) => c.category)))],
    [],
  );

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return CLIENTS.filter((c) => {
      // Search: name, clientId, phone, sources
      if (q) {
        const haystack = [
          c.name,
          c.clientId,
          c.payoutPhone ?? "",
          c.bankAccount ?? "",
          ...c.sources.map((s) => s.name + s.sourceId),
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      // Category filter
      if (filterCategory !== "All" && c.category !== filterCategory) return false;
      // Loan filter
      if (filterLoan === "With loan") {
        const hasLoan = c.contracts.some((con) => con.unitLoan !== null);
        if (!hasLoan) return false;
      } else if (filterLoan === "No loan") {
        const hasLoan = c.contracts.some((con) => con.unitLoan !== null);
        if (hasLoan) return false;
      }
      // Status filter
      if (filterStatus === "Active" && c.status !== "ACTIVE") return false;
      if (filterStatus === "Inactive" && c.status !== "INACTIVE") return false;
      return true;
    });
  }, [search, filterCategory, filterLoan, filterStatus]);

  // ── Sort ───────────────────────────────────────────────────────────────────
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let va: string, vb: string;
      switch (sortKey) {
        case "clientId":       va = a.clientId;         vb = b.clientId;         break;
        case "name":           va = a.name;              vb = b.name;             break;
        case "category":       va = a.category;          vb = b.category;         break;
        case "paymentFrequency": va = a.paymentFrequency; vb = b.paymentFrequency; break;
        case "status":         va = a.status;            vb = b.status;           break;
        default:               va = a.clientId;         vb = b.clientId;
      }
      const cmp = va.localeCompare(vb);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function handleImportExcel() {
    fileRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // TODO: parse and upload Excel
    alert(`Import received: ${file.name}\n(Excel import processing coming soon)`);
    e.target.value = "";
  }

  return (
    <div className="space-y-4">
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            Clients
          </h1>
          <p className="mt-1 text-[13px] text-slate-500">
            {totalActive.toLocaleString()} active clients · search by name, phone, ID or site
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Import Excel */}
          <button
            onClick={handleImportExcel}
            className="flex items-center gap-1.5 rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <svg className="h-4 w-4 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            Import Excel
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFileChange}
          />
          {/* Add Client */}
          <Link
            href="/clients/new"
            className="rounded-md bg-[#0B4F7C] px-3 py-2 text-[13px] font-medium text-white hover:bg-[#083d61] transition-colors shadow-sm"
          >
            + Add Client
          </Link>
        </div>
      </div>

      {/* ── Search + filters bar ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search clients…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-[#E2E8F0] bg-white py-2 pl-9 pr-3 text-[13px] text-slate-700 placeholder:text-slate-400 focus:border-[#0B4F7C] focus:outline-none focus:ring-2 focus:ring-[#0B4F7C]/20"
          />
        </div>

        {/* Category / Site */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-[13px] text-slate-600 focus:border-[#0B4F7C] focus:outline-none"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === "All" ? "Category: All" : c}
            </option>
          ))}
        </select>

        {/* Loan */}
        <select
          value={filterLoan}
          onChange={(e) => setFilterLoan(e.target.value)}
          className="rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-[13px] text-slate-600 focus:border-[#0B4F7C] focus:outline-none"
        >
          {["Any", "With loan", "No loan"].map((o) => (
            <option key={o} value={o}>
              {o === "Any" ? "Loan: Any" : o}
            </option>
          ))}
        </select>

        {/* Status */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-[13px] text-slate-600 focus:border-[#0B4F7C] focus:outline-none"
        >
          {["All", "Active", "Inactive"].map((o) => (
            <option key={o} value={o}>
              {o === "All" ? "Status: All" : `Status: ${o}`}
            </option>
          ))}
        </select>

        {/* Results count */}
        <span className="ml-auto text-[12px] text-slate-400">
          {sorted.length} of {CLIENTS.length} clients
        </span>
      </div>

      {/* ── Table (desktop) ──────────────────────────────────────────────────── */}
      <div className="hidden sm:block rounded-lg border border-[#E2E8F0] bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr>
                <Th label="Client ID"         sortKey="clientId"         current={sortKey} dir={sortDir} onSort={handleSort} />
                <Th label="Client Name"       sortKey="name"             current={sortKey} dir={sortDir} onSort={handleSort} />
                <Th label="Client Category"   sortKey="category"         current={sortKey} dir={sortDir} onSort={handleSort} />
                <Th label="Payment Frequency" sortKey="paymentFrequency" current={sortKey} dir={sortDir} onSort={handleSort} />
                <th className="border-b border-[#E2E8F0] bg-slate-50 px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.07em] text-slate-500 text-left whitespace-nowrap">
                  Next Payment Month
                </th>
                <th className="border-b border-[#E2E8F0] bg-slate-50 px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.07em] text-slate-500 text-center whitespace-nowrap">
                  Active Contract
                </th>
                <th className="border-b border-[#E2E8F0] bg-slate-50 px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.07em] text-slate-500 text-center whitespace-nowrap">
                  Active Sources
                </th>
                <Th label="Status" sortKey="status" current={sortKey} dir={sortDir} onSort={handleSort} />
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[13px] text-slate-400">
                    No clients match your filters.
                  </td>
                </tr>
              )}
              {sorted.map((c) => {
                const activeContracts = getActiveContracts(c);
                const activeSources   = getActiveSources(c);
                const needsReg        = activeContracts === 0;

                return (
                  <tr
                    key={c.id}
                    className="group cursor-pointer hover:bg-[#F3F6FA] transition-colors"
                  >
                    {/* Client ID */}
                    <td className="border-b border-slate-100 px-3 py-2.5">
                      <Link
                        href={`/clients/${c.id}`}
                        className="font-mono text-[12px] font-semibold text-[#0B4F7C] hover:underline"
                      >
                        {c.clientId}
                      </Link>
                    </td>

                    {/* Client name */}
                    <td className="border-b border-slate-100 px-3 py-2.5">
                      <Link
                        href={`/clients/${c.id}`}
                        className="font-medium text-slate-800 hover:text-[#0B4F7C] hover:underline"
                      >
                        {c.name}
                      </Link>
                    </td>

                    {/* Category */}
                    <td className="border-b border-slate-100 px-3 py-2.5 text-slate-600">
                      {c.category}
                    </td>

                    {/* Payment frequency */}
                    <td className="border-b border-slate-100 px-3 py-2.5 text-slate-600">
                      {c.paymentFrequency === "MONTHLY" ? "Monthly" : "Once 3 months"}
                    </td>

                    {/* Next payment month */}
                    <td className="border-b border-slate-100 px-3 py-2.5 font-mono text-[12px] text-slate-500">
                      {nextPaymentMonth(c)}
                    </td>

                    {/* Active contracts — red if 0 */}
                    <td className="border-b border-slate-100 px-3 py-2.5 text-center">
                      {needsReg ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-semibold text-red-600">
                          ⚠ Registration Required
                        </span>
                      ) : (
                        <span className="font-semibold text-slate-700">{activeContracts}</span>
                      )}
                    </td>

                    {/* Active sources — red if 0 */}
                    <td className="border-b border-slate-100 px-3 py-2.5 text-center">
                      <span
                        className={`font-semibold ${activeSources === 0 ? "text-red-500" : "text-slate-700"}`}
                      >
                        {activeSources}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="border-b border-slate-100 px-3 py-2.5">
                      <Pill s={c.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Card list (mobile) ────────────────────────────────────────────────── */}
      <div className="space-y-3 sm:hidden">
        {sorted.length === 0 && (
          <p className="py-10 text-center text-[13px] text-slate-400">No clients match your filters.</p>
        )}
        {sorted.map((c) => {
          const activeContracts = getActiveContracts(c);
          const activeSources   = getActiveSources(c);
          const needsReg        = activeContracts === 0;
          return (
            <div key={c.id} className="rounded-lg border border-[#E2E8F0] bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link href={`/clients/${c.id}`} className="font-semibold text-[#0B4F7C] hover:underline">
                    {c.name}
                  </Link>
                  <p className="font-mono text-[11px] text-slate-400">{c.clientId}</p>
                </div>
                <Pill s={c.status} />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[12px] text-slate-600">
                <span><span className="text-slate-400">Category: </span>{c.category}</span>
                <span><span className="text-slate-400">Freq: </span>{c.paymentFrequency === "MONTHLY" ? "Monthly" : "3-month"}</span>
                <span><span className="text-slate-400">Next pmt: </span>{nextPaymentMonth(c)}</span>
                <span><span className="text-slate-400">Sources: </span>
                  <span className={activeSources === 0 ? "text-red-500 font-semibold" : ""}>{activeSources}</span>
                </span>
              </div>
              {needsReg && (
                <p className="mt-2 text-[11px] font-semibold text-red-600">⚠ Registration Required — no active contracts</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
