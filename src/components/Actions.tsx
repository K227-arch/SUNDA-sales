"use client";

import { useState } from "react";
import { api } from "@/lib/api";

export function SeedButton() {
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  async function run() {
    setBusy(true);
    try {
      const r = (await api<{ clients: number; collections: number }>("/api/seed", { method: "POST" })) as { clients: number; collections: number };
      setMsg(`Seeded ${r.clients} clients, ${r.collections} collections`);
      setTimeout(() => location.reload(), 700);
    } catch (e) {
      setMsg("Error: " + (e as Error).message);
    }
    setBusy(false);
  }
  return (
    <div className="flex items-center gap-2 text-[13px]">
      {busy ? (
        <span className="text-slate-400">Seeding…</span>
      ) : (
        <button onClick={run} className="rounded-md bg-[#0B4F7C] px-3 py-1.5 text-[13px] font-medium text-white hover:bg-[#083d61] transition-colors">
          Seed demo data
        </button>
      )}
      {msg && <span className="text-slate-500">{msg}</span>}
    </div>
  );
}

export function CalculateButton({ period }: { period: string }) {
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  async function run() {
    setBusy(true);
    try {
      const r = (await api<{ calcs: unknown[] }>("/api/cycles", {
        method: "POST",
        body: JSON.stringify({ period }),
      })) as { calcs: unknown[] };
      setMsg(`Calculated ${r.calcs?.length ?? 0} payouts`);
      setTimeout(() => location.reload(), 700);
    } catch (e) {
      setMsg("Error: " + (e as Error).message);
    }
    setBusy(false);
  }
  return (
    <div className="flex items-center gap-2 text-[13px]">
      {busy ? (
        <span className="text-slate-400">Calculating…</span>
      ) : (
        <button onClick={run} className="rounded-md bg-[#0B4F7C] px-3 py-1.5 text-[13px] font-medium text-white hover:bg-[#083d61] transition-colors">
          Calculate {period}
        </button>
      )}
      {msg && <span className="text-slate-500">{msg}</span>}
    </div>
  );
}

export function RunReconButton({ period }: { period: string }) {
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  async function run() {
    setBusy(true);
    try {
      const r = (await api<{ summary: { matched: number; mismatch: number; yoOnly: number; serverOnly: number } }>(
        "/api/reconciliation/run",
        { method: "POST", body: JSON.stringify({ period }) },
      )) as { summary: { matched: number; mismatch: number; yoOnly: number; serverOnly: number } };
      setMsg(
        `Matched ${r.summary.matched}, mismatch ${r.summary.mismatch}, yo-only ${r.summary.yoOnly}, server-only ${r.summary.serverOnly}`,
      );
      setTimeout(() => location.reload(), 700);
    } catch (e) {
      setMsg("Error: " + (e as Error).message);
    }
    setBusy(false);
  }
  return (
    <div className="flex items-center gap-2 text-[13px]">
      {busy ? (
        <span className="text-slate-400">Running…</span>
      ) : (
        <button onClick={run} className="rounded-md bg-[#0B4F7C] px-3 py-1.5 text-[13px] font-medium text-white hover:bg-[#083d61] transition-colors">
          Run reconciliation
        </button>
      )}
      {msg && <span className="text-slate-500">{msg}</span>}
    </div>
  );
}
