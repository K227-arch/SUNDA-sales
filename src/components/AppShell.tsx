"use client";

import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";

const NAV = [
  { group: "Operations", links: [
    { href: "/dashboard",       label: "Dashboard",       icon: "▦" },
    { href: "/clients",         label: "Clients",         icon: "👥" },
    { href: "/reconciliation",  label: "Reconciliation",  icon: "⇄" },
    { href: "/payout-cycle",    label: "Payout Cycle",    icon: "💸" },
    { href: "/loans",           label: "Unit Loans",      icon: "🏦" },
    { href: "/payout-requests", label: "Payout Requests", icon: "📩" },
  ]},
  { group: "Control", links: [
    { href: "/approvals", label: "Approvals",     icon: "✓"  },
    { href: "/efris",     label: "EFRIS / Sales", icon: "📋" },
    { href: "/reports",   label: "Reports",       icon: "📊" },
  ]},
  { group: "Admin", links: [
    { href: "/users", label: "Users & Audit", icon: "🔐" },
  ]},
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4">
        <div>
          <div className="text-base font-bold tracking-tight text-[#0B4F7C]">SUNDA</div>
          <div className="mt-0.5 text-[11px] font-medium tracking-wide text-slate-400 uppercase">
            Payout &amp; Unit Loans
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100 lg:hidden" aria-label="Close menu">
            ✕
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV.map((group) => (
          <div key={group.group}>
            <div className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              {group.group}
            </div>
            <div className="space-y-0.5">
              {group.links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={onClose}
                  className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium text-slate-600 hover:bg-[#E6F1FA] hover:text-[#0B4F7C] transition-colors"
                >
                  <span className="w-4 text-center text-sm leading-none">{l.icon}</span>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-[#E2E8F0] px-5 py-3">
        <div className="text-[13px] font-semibold text-slate-700">maiki</div>
        <div className="text-[11px] text-slate-400 mt-0.5">Accountant · Phase 0</div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* ── Desktop sidebar (always visible ≥ lg) ── */}
      <aside className="hidden lg:flex w-56 shrink-0 flex-col border-r border-[#E2E8F0] bg-white">
        <SidebarContent />
      </aside>

      {/* ── Mobile drawer overlay ── */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl">
            <SidebarContent onClose={() => setOpen(false)} />
          </aside>
        </div>
      )}

      {/* ── Main content ── */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b border-[#E2E8F0] bg-white px-4 py-3 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="text-[13px] font-medium text-slate-500">Sep 2026 cycle</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span className="hidden rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 sm:inline">
              3 pending approvals
            </span>
            <span className="text-base">🔔</span>
            <span className="hidden text-[13px] font-medium text-slate-600 sm:inline">maiki</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-[#F3F6FA] p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
