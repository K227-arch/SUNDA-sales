"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ── Constants ─────────────────────────────────────────────────────────────────
const CATEGORIES = [
  "ASP",
  "Private Water Vendor",
  "Private Operator",
  "Sunda Direct Management",
  "Community Management",
  "Donor",
] as const;

const REPORT_FORMATS = [
  "Water Collection & Maintenance",
  "Government Report",
  "Private Vendor Report",
  "ASP Report",
  "3-Month Vendor Report",
] as const;

const TRANSFER_CONDITIONS = [
  "Standard payout after reconciliation",
  "Pending contract completion",
  "Requires manual approval each cycle",
  "On-hold until loan is cleared",
] as const;

// ── Form state type ───────────────────────────────────────────────────────────
interface FormState {
  name: string;
  clientId: string;
  category: string;
  transferCondition: string;
  paymentFrequency: "MONTHLY" | "QUARTERLY" | "";
  paymentStartMonth: string;
  transferMethod: "MOBILE_MONEY" | "BANK" | "";
  payoutPhone: string;
  bankAccount: string;
  reportFormat: string;
}

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-[13px] font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}

// ── Input / Select shared classes ─────────────────────────────────────────────
const inputCls =
  "w-full rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-[13px] text-slate-800 placeholder:text-slate-400 focus:border-[#0B4F7C] focus:outline-none focus:ring-2 focus:ring-[#0B4F7C]/20";

// ── Page ──────────────────────────────────────────────────────────────────────
export default function RegisterClientPage() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    name: "",
    clientId: "",
    category: "",
    transferCondition: "",
    paymentFrequency: "",
    paymentStartMonth: "",
    transferMethod: "",
    payoutPhone: "",
    bankAccount: "",
    reportFormat: "",
  });

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function set(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Basic validation
    if (!form.name.trim()) return setError("Client name is required.");
    if (!form.category) return setError("Client category is required.");
    if (!form.paymentFrequency) return setError("Payment frequency is required.");
    if (!form.transferMethod) return setError("Transfer method is required.");
    if (form.transferMethod === "MOBILE_MONEY" && !form.payoutPhone.trim())
      return setError("Mobile money number is required.");
    if (form.transferMethod === "BANK" && !form.bankAccount.trim())
      return setError("Bank account details are required.");

    setBusy(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Registration failed");
      router.push(`/clients/${data.id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[13px]">
        <Link href="/clients" className="text-[#0B4F7C] hover:underline">
          ← Clients
        </Link>
        <span className="text-slate-300">/</span>
        <span className="font-medium text-slate-700">Register new client</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Section 1: Identity ───────────────────────────────────────────── */}
        <section className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-sm space-y-4">
          <h2 className="text-[13px] font-bold uppercase tracking-wide text-slate-400">
            Client Identity
          </h2>

          <Field label="Client Name" required>
            <input
              className={inputCls}
              placeholder="e.g. Kampala Water Services Ltd"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </Field>

          <Field label="Client ID" hint="Leave blank to auto-generate">
            <input
              className={inputCls}
              placeholder="e.g. C-123456789"
              value={form.clientId}
              onChange={(e) => set("clientId", e.target.value)}
            />
          </Field>

          <Field label="Client Category" required>
            <select
              className={inputCls}
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
            >
              <option value="">Select a category…</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
        </section>

        {/* ── Section 2: Payment terms ──────────────────────────────────────── */}
        <section className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-sm space-y-4">
          <h2 className="text-[13px] font-bold uppercase tracking-wide text-slate-400">
            Payment Terms
          </h2>

          <Field label="Transfer Condition">
            <select
              className={inputCls}
              value={form.transferCondition}
              onChange={(e) => set("transferCondition", e.target.value)}
            >
              <option value="">Select a condition…</option>
              {TRANSFER_CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Payment Frequency" required>
            <div className="flex gap-3">
              {(["MONTHLY", "QUARTERLY"] as const).map((freq) => (
                <label
                  key={freq}
                  className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-[13px] font-medium transition-colors ${
                    form.paymentFrequency === freq
                      ? "border-[#0B4F7C] bg-[#E6F1FA] text-[#0B4F7C]"
                      : "border-[#E2E8F0] text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    className="sr-only"
                    name="paymentFrequency"
                    value={freq}
                    checked={form.paymentFrequency === freq}
                    onChange={() => set("paymentFrequency", freq)}
                  />
                  {freq === "MONTHLY" ? "Monthly" : "Once every 3 months"}
                </label>
              ))}
            </div>
          </Field>

          <Field
            label="Payment Start Month"
            hint="First month the client will receive a payout"
          >
            <input
              type="month"
              className={inputCls}
              value={form.paymentStartMonth}
              onChange={(e) => set("paymentStartMonth", e.target.value)}
            />
          </Field>
        </section>

        {/* ── Section 3: Transfer details ───────────────────────────────────── */}
        <section className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-sm space-y-4">
          <h2 className="text-[13px] font-bold uppercase tracking-wide text-slate-400">
            Where to Transfer
          </h2>

          <Field label="Transfer Method" required>
            <div className="flex gap-3">
              {(["BANK", "MOBILE_MONEY"] as const).map((method) => (
                <label
                  key={method}
                  className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-[13px] font-medium transition-colors ${
                    form.transferMethod === method
                      ? "border-[#0B4F7C] bg-[#E6F1FA] text-[#0B4F7C]"
                      : "border-[#E2E8F0] text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    className="sr-only"
                    name="transferMethod"
                    value={method}
                    checked={form.transferMethod === method}
                    onChange={() => set("transferMethod", method)}
                  />
                  {method === "BANK" ? "🏦 Bank" : "📱 Mobile Money"}
                </label>
              ))}
            </div>
          </Field>

          {form.transferMethod === "MOBILE_MONEY" && (
            <Field label="Mobile Money Number (1)" required hint="MSISDN used for disbursement e.g. 256701234567">
              <input
                className={inputCls}
                placeholder="256701234567"
                value={form.payoutPhone}
                onChange={(e) => set("payoutPhone", e.target.value)}
              />
            </Field>
          )}

          {form.transferMethod === "BANK" && (
            <Field label="Bank Account Details (1)" required hint="Account name, bank name, account number">
              <textarea
                className={`${inputCls} resize-none`}
                rows={3}
                placeholder="Account name: …&#10;Bank: …&#10;Account no: …"
                value={form.bankAccount}
                onChange={(e) => set("bankAccount", e.target.value)}
              />
            </Field>
          )}
        </section>

        {/* ── Section 4: Reporting ──────────────────────────────────────────── */}
        <section className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-sm space-y-4">
          <h2 className="text-[13px] font-bold uppercase tracking-wide text-slate-400">
            Reporting
          </h2>

          <Field label="Monthly Report Format">
            <select
              className={inputCls}
              value={form.reportFormat}
              onChange={(e) => set("reportFormat", e.target.value)}
            >
              <option value="">Select a format…</option>
              {REPORT_FORMATS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </Field>
        </section>

        {/* ── Error banner ──────────────────────────────────────────────────── */}
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
            {error}
          </div>
        )}

        {/* ── Actions ───────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 pb-6">
          <Link
            href="/clients"
            className="rounded-md border border-[#E2E8F0] px-4 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-[#0B4F7C] px-5 py-2 text-[13px] font-medium text-white hover:bg-[#083d61] disabled:opacity-60 transition-colors"
          >
            {busy ? "Registering…" : "Register Client"}
          </button>
        </div>
      </form>
    </div>
  );
}
