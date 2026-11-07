"use client";

import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";

const NAV = [
  { group: "Operations", links: [
    { href: "/dashboard",       label: "Dashboard",       icon: "▦" },
    { href: "/clients",         label: "Clients",         icon: "👥" },
    { href: "/reconciliation",  label: "Reconciliation",  icon: "⇄" },
    { href: "/payout-cycle",    label: "Payout cycle",    icon: "💸" },
    { href: "/loans",           label: "Unit loans",      icon: "🏦" },
    { href: "/payout-requests", label: "Payout requests", icon: "📩" },
  ]},
  { group: "Control", links: [
    { href: "/approvals", label: "Approvals",    icon: "✓"  },
    { href: "/efris",     label: "EFRIS / Sales",icon: "📋" },
    { href: "/reports",   label: "Reports",      icon: "📊" },
  ]},
  { group: "Admin", links: [
    { href: "/users", label: "Users & audit", icon: "🔐" },
  ]},
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] px-4 py-4">
        <div>
          <div className="text-lg font-bold text-[#0B4F7C]">SUNDA</div>
          <div className="text-xs text-slate-400">Payout &amp; Unit Loans</div>
        </div>
        {onClose && (
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100 lg:hidden" aria-label="Close menu">
            ✕
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {NAV.map((group) => (
          <div key={group.group} className="mb-4">
            <div className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              {group.group}
            </div>
            {group.links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={onClose}
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-slate-700 hover:bg-[#E6F1FA] hover:text-[#0B4F7C]"
              >
                <span className="w-5 text-center text-base">{l.icon}</span>
                {l.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-[#E2E8F0] px-4 py-3 text-xs text-slate-400">
        <div className="font-medium text-slate-600">maiki</div>
        <div>Accountant · Phase 0</div>
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
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          {/* Drawer */}
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
            {/* Hamburger — mobile only */}
            <button
              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="text-sm font-medium text-slate-600">Sep 2026 cycle</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="hidden rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700 sm:inline">
              3 pending approvals
            </span>
            <span className="text-base">🔔</span>
            <span className="hidden sm:inline">maiki</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-[#F3F6FA] p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
