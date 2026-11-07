/**
 * SUNDA main server adapter
 * Implements the two live endpoints from the Notion API spec (v001):
 *   [A] POST /api/v001/users/lookup       – retrieve user info + water balance
 *   [B] POST /api/v001/users/manual-reload – register a manual water reload
 *
 * Auth: MD5 signature  sign = md5(kioskCode + datetime + SECRET)
 * Headers: X-Kiosk-Code, X-Timestamp, X-Auth-Key
 * All other endpoints (collections list, clients list, sources) are STUBBED
 * pending Sunda extending their API — see docs/API_Requirements.
 */

import crypto from "node:crypto";

const BASE        = process.env.SUNDA_API_BASE    ?? "https://sunda-dev.as-t.net";
const KIOSK_CODE  = process.env.SUNDA_KIOSK_CODE  ?? "KGL-001";
const SECRET      = process.env.SUNDA_API_SECRET  ?? "";

// ── Auth helpers ──────────────────────────────────────────────────────────────

/** md5(kioskCode + datetime + SECRET) — exactly as the Notion spec defines. */
function buildSign(kioskCode: string, datetime: number): string {
  return crypto
    .createHash("md5")
    .update(`${kioskCode}${datetime}${SECRET}`)
    .digest("hex");
}

function authHeaders(datetime: number): Record<string, string> {
  return {
    "X-Kiosk-Code": KIOSK_CODE,
    "X-Timestamp":  String(datetime),
    "X-Auth-Key":   buildSign(KIOSK_CODE, datetime),
    "Content-Type": "application/json",
  };
}

// ── Response types (matching the Notion spec exactly) ────────────────────────

export interface SundaUserInfo {
  name:         string;
  status:       "ACTIVE" | "INACTIVE";
  waterBalance: number;    // litres
  createdAt:    string;    // ISO-8601 UTC
  updatedAt:    string;    // ISO-8601 UTC
}

export interface SundaReloadResult {
  volume:       number;   // registered reload volume (L)
  waterBalance: number;   // new balance after reload (L)
}

export interface SundaError {
  code:    string;
  message: string;
}

export type SundaResult<T> =
  | { success: true;  data: T }
  | { success: false; error: SundaError };

// ── [A] users/lookup ──────────────────────────────────────────────────────────

/**
 * Fetch live user info + water balance for a single client by their paymentId.
 * paymentId max 9 characters (Notion spec constraint).
 * Returns null when the server is unreachable (dev fallback — keeps mock data working).
 */
export async function lookupUser(
  paymentId: string,
): Promise<SundaResult<SundaUserInfo> | null> {
  if (!SECRET) {
    console.warn("[sunda-server] SUNDA_API_SECRET not set — skipping live lookup");
    return null;
  }

  const datetime = Math.floor(Date.now() / 1000);
  const sign     = buildSign(KIOSK_CODE, datetime);

  try {
    const res = await fetch(`${BASE}/api/v001/users/lookup`, {
      method:  "POST",
      headers: authHeaders(datetime),
      body: JSON.stringify({
        paymentId,
        kioskCode: KIOSK_CODE,
        datetime,
        sign,
      }),
      // Keep alive for server-side Next.js calls; short timeout so a slow
      // main server never blocks the page render.
      signal: AbortSignal.timeout(6_000),
      cache:  "no-store",
    });

    const body = await res.json() as SundaResult<SundaUserInfo>;
    return body;
  } catch (err) {
    console.error("[sunda-server] lookupUser failed:", err);
    return null;   // caller falls back to mock data
  }
}

// ── [B] users/manual-reload ───────────────────────────────────────────────────

export interface ManualReloadParams {
  paymentId:      string;
  litres:         number;           // integer litres dispensed
  amountRwf?:     number;           // amount in RWF (optional for Uganda builds)
  m3Issued?:      number;           // cubic metres (optional)
  tariffRwfPerM3?:number;           // optional
  occurredAt?:    string;           // ISO-8601 UTC; defaults to now
  reference:      string;           // unique transaction reference (idempotency key)
  mode?:          number;           // processing mode (Notion spec: required field value 2)
}

/**
 * Register a manual water reload on the SUNDA main server.
 * This is the kiosk sale record that feeds reconciliation.
 * reference must be unique per transaction — the server returns 409 ALREADY_EXISTS
 * if the same reference is sent twice (idempotency guard).
 */
export async function registerManualReload(
  params: ManualReloadParams,
): Promise<SundaResult<SundaReloadResult>> {
  if (!SECRET) {
    return { success: false, error: { code: "NO_SECRET", message: "SUNDA_API_SECRET not configured" } };
  }

  const datetime  = Math.floor(Date.now() / 1000);
  const sign      = buildSign(KIOSK_CODE, datetime);
  const occurredAt= params.occurredAt ?? new Date().toISOString();

  const body = {
    mode:          params.mode ?? 2,
    sign,
    litres:        params.litres,
    datetime,
    m3Issued:      params.m3Issued  ?? params.litres / 1000,
    amountRwf:     params.amountRwf ?? 0,
    kioskCode:     KIOSK_CODE,
    paymentId:     params.paymentId,
    reference:     params.reference,
    occurredAt,
    tariffRwfPerM3:params.tariffRwfPerM3 ?? 0,
  };

  try {
    const res = await fetch(`${BASE}/api/v001/users/manual-reload`, {
      method:  "POST",
      headers: authHeaders(datetime),
      body:    JSON.stringify(body),
      signal:  AbortSignal.timeout(10_000),
      cache:   "no-store",
    });

    return await res.json() as SundaResult<SundaReloadResult>;
  } catch (err) {
    console.error("[sunda-server] registerManualReload failed:", err);
    return {
      success: false,
      error: { code: "NETWORK_ERROR", message: String(err) },
    };
  }
}

// ── Stubs for endpoints that don't exist yet ──────────────────────────────────
// These will be implemented once Sunda extends the API.
// Documented in: docs/API_Requirements_for_SUNDA_Payout_System_updated.docx

export async function listCollections(_from: string, _to: string) {
  throw new Error("SUNDA API endpoint /api/v001/collections/list does not exist yet. See API requirements doc.");
}

export async function listClients() {
  throw new Error("SUNDA API endpoint /api/v001/clients/list does not exist yet. See API requirements doc.");
}

export async function listSources() {
  throw new Error("SUNDA API endpoint /api/v001/sources/list does not exist yet. See API requirements doc.");
}
