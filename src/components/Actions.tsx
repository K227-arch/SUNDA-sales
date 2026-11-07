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
    <div className="text-sm">
      {busy ? (
        "Seeding..."
      ) : (
        <button onClick={run} className="rounded-md bg-[#0B4F7C] px-3 py-1.5 text-white hover:bg-[#0a4570]">
          Seed demo data
        </button>
      )}
      {msg && <span className="ml-2 text-slate-500">{msg}</span>}
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
    <div className="text-sm">
      {busy ? (
        "Calculating..."
      ) : (
        <button onClick={run} className="rounded-md bg-[#0B4F7C] px-3 py-1.5 text-white hover:bg-[#0a4570]">
          Calculate {period}
        </button>
      )}
      {msg && <span className="ml-2 text-slate-500">{msg}</span>}
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
    <div className="text-sm">
      {busy ? (
        "Running..."
      ) : (
        <button onClick={run} className="rounded-md bg-[#0B4F7C] px-3 py-1.5 text-white hover:bg-[#0a4570]">
          Run reconciliation
        </button>
      )}
      {msg && <span className="ml-2 text-slate-500">{msg}</span>}
    </div>
  );
}
