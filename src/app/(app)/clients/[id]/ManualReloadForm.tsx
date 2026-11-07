"use client";

import { useState } from "react";

export function ManualReloadForm({ paymentId }: { paymentId: string }) {
  const [litres,   setLitres]   = useState("");
  const [amount,   setAmount]   = useState("");
  const [ref,      setRef]      = useState("");
  const [status,   setStatus]   = useState<"idle"|"loading"|"ok"|"error">("idle");
  const [msg,      setMsg]      = useState("");
  const [newBal,   setNewBal]   = useState<number|null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!litres || !ref) return;
    setStatus("loading"); setMsg("");

    const res = await fetch("/api/sunda/reload", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        paymentId,
        litres:    Number(litres),
        amountRwf: amount ? Number(amount) : undefined,
        reference: ref,
        occurredAt: new Date().toISOString(),
      }),
    });

    const json = await res.json();
    if (json.success) {
      setStatus("ok");
      setNewBal(json.data.waterBalance);
      setMsg(`✓ Registered ${litres} L. New water balance: ${json.data.waterBalance} L`);
      setLitres(""); setAmount(""); setRef("");
    } else {
      setStatus("error");
      setMsg(`Error ${json.error?.code}: ${json.error?.message}`);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Litres <span className="text-red-500">*</span>
          </label>
          <input
            type="number" min="1" step="1" required
            value={litres} onChange={(e) => setLitres(e.target.value)}
            placeholder="e.g. 20"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#0B4F7C] focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Amount (RWF / optional)</label>
          <input
            type="number" min="0" step="0.01"
            value={amount} onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 2.5"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#0B4F7C] focus:outline-none"
          />
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Reference <span className="text-red-500">*</span>
            <span className="ml-1 font-normal text-slate-400">(unique per transaction — duplicate returns 409)</span>
          </label>
          <input
            required
            value={ref} onChange={(e) => setRef(e.target.value)}
            placeholder="e.g. WND-KCKR147Y"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#0B4F7C] focus:outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-md bg-[#0B4F7C] px-4 py-2 text-sm font-medium text-white hover:bg-[#0a4570] disabled:bg-slate-300"
        >
          {status === "loading" ? "Registering…" : "Register reload on SUNDA server"}
        </button>
        {msg && (
          <span className={`text-sm ${status === "ok" ? "text-emerald-600" : "text-red-600"}`}>
            {msg}
          </span>
        )}
      </div>

      {newBal !== null && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          New water balance on SUNDA server: <strong>{newBal.toLocaleString("en-US")} L</strong>
        </div>
      )}
    </form>
  );
}
