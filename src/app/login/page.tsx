"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const DEMO = [
  { u: "admin",   pw: "admin123",  role: "Admin" },
  { u: "maiki",   pw: "maiki123",  role: "Accountant" },
  { u: "aya",     pw: "aya123",    role: "Approver" },
  { u: "viewer1", pw: "viewer123", role: "Viewer" },
];

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mfa,      setMfa]      = useState("");
  const [step,     setStep]     = useState<"creds" | "mfa">("creds");
  const [error,    setError]    = useState("");
  const router = useRouter();

  function submitCreds(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const match = DEMO.find((d) => d.u === username && d.pw === password);
    if (!match) { setError("Invalid username or password."); return; }
    setStep("mfa");
  }

  function submitMfa(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    // Demo: any 6-digit code is accepted
    if (!/^\d{6}$/.test(mfa)) { setError("Enter the 6-digit code from your authenticator app."); return; }
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F3F6FA]">
      <div className="w-80 space-y-5 rounded-xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
        {/* Logo */}
        <div className="text-center">
          <div className="text-2xl font-bold text-[#0B4F7C]">SUNDA</div>
          <div className="text-xs text-slate-400">Payout &amp; Unit Loan System</div>
        </div>

        {step === "creds" ? (
          <form onSubmit={submitCreds} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Username</label>
              <input
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#0B4F7C] focus:outline-none"
                placeholder="username"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#0B4F7C] focus:outline-none"
                placeholder="password"
              />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button className="w-full rounded-md bg-[#0B4F7C] py-2 text-sm font-medium text-white hover:bg-[#0a4570]">
              Continue
            </button>
            <div className="rounded-md bg-slate-50 p-3 text-xs text-slate-500">
              <p className="mb-1 font-medium">Demo accounts</p>
              {DEMO.map((d) => (
                <div key={d.u} className="flex justify-between">
                  <span>{d.u} / {d.pw}</span>
                  <span className="text-slate-400">{d.role}</span>
                </div>
              ))}
            </div>
          </form>
        ) : (
          <form onSubmit={submitMfa} className="space-y-3">
            <p className="text-sm text-slate-600">
              Enter the 6-digit code from your authenticator app.
            </p>
            <input
              autoFocus
              value={mfa}
              onChange={(e) => setMfa(e.target.value)}
              maxLength={6}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-center text-lg tracking-widest focus:border-[#0B4F7C] focus:outline-none"
              placeholder="000000"
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button className="w-full rounded-md bg-[#0B4F7C] py-2 text-sm font-medium text-white hover:bg-[#0a4570]">
              Sign in
            </button>
            <p className="text-center text-xs text-slate-400">Demo: any 6 digits accepted</p>
            <button type="button" onClick={() => setStep("creds")} className="w-full text-center text-xs text-[#0B4F7C] hover:underline">
              ← Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
