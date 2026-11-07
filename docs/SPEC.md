# SUNDA Payout & Unit Loan Management System — Specification & Implementation Plan

**Version:** 0.3 (working draft for build)
**Prepared:** 30 October 2026
**Stack:** Next.js (App Router, TypeScript) full-stack + Prisma ORM. Dev DB: SQLite. Prod DB: PostgreSQL via `DATABASE_URL`.

---

## 1. Purpose and scope

An internal accounting tool for SUNDA staff to run monthly client payouts and manage water-unit loans. It reconciles water-fee collections, calculates Sunda's commission and client fees and loan repayments, determines the net payout to each client, disburses approved payouts (mobile money via Yo!Uganda; bank manually), registers the Sunda Commission (= sales) to EFRIS, and produces per-recipient reports. A companion mobile application lets clients view balances/history and submit payout (liquidation) requests.

The **internal staff system** is the focus of this build. The mobile app is integrated via shared APIs but is a separate client.

## 2. Document precedence and authority

This system is built from two source documents, with the following precedence:

1. **`Cient Payout and SUNDA Unit Loan Management System Development.docx`** (Sunda's corrections/comments) — **DOMINANT**. It defines the authoritative business logic, data hierarchy, financial model, flows, and corrections. Where it conflicts with the other doc, it wins.
2. **`Sunda_Internal_Payout_and_Unit_Loan_System_Revised.docx`** (the technical design) — used for **UI / screens** (S1–S16 layout, navigation, design system, accessibility) and for technical architecture choices that the development doc does not override.

Everything in the development doc takes priority. Key corrections the development doc makes to the technical design:
- Discrepancy resolution is **out-of-system** (email Yo!Uganda / Japanese company), not an in-app maker-checker drawer.
- A separate **Approvals screen (S9) is in doubt** — pending decision.
- **Bank disbursement is manual** (go to the bank, then set status).
- **EFRIS is a "Register EFRIS" button + PDF download**, i.e. semi-manual, not necessarily a live integration.
- A **Manual Payment Registration** function is added (when Sunda receives money directly).
- Data is organised **Client → Contract → Source**; sources come from the SUNDA main server.

## 3. System overview

Monthly cycle: pull collections (SUNDA main server + Yo!Uganda) → reconcile → calculate per-contract payout (commission, fees, loan repayment) → approve → disburse (mobile money or bank) → register Sunda Commission to EFRIS → generate reports. Payout (liquidation) requests can also come from the mobile app mid-month.

Information sources:
- **SUNDA main server** — water-fee collections, customers, and **sources** (water points).
- **Yo!Uganda** — mobile-money payment records and outbound disbursement.
- **EFRIS** — tax/sales registration.

## 4. Data hierarchy: Client → Contract → Source

- **Client** = the payout recipient ("where the water collection is sent to"). Categories: ASP / Private Water Vendor / Private Operator / Sunda Direct Management / Community Management / Donor. A client has transfer conditions, payment frequency, and a monthly report format.
- **Contract** (per client, can be several) = the financial agreement: contract ID, **TIN / legal name** (for EFRIS), active period (terms can change over time; each version registered), monthly payment term, initial fee, monthly fee, maintenance fee, bank transfer charge, **unit-loan terms** (unit type, total purchase amount, payment period, monthly repay amount), and the **Sources** attached. Contract terms (e.g. commission %) can change over time.
- **Source** (per contract, can be several) = the actual water point (tap, kiosk, meter). **Source name/ID comes from the SUNDA main server.** Collections and reports work at source granularity.

## 5. User roles and access

| Role | Can |
|---|---|
| **Admin** | Everything (all authorities). |
| **Accountant** (Maiki) | Register clients/contracts, calculate, make transfers, send approval requests, register EFRIS, manual payment registration. |
| **Approver / Admin** (Aya) | Approve transfers and monthly reports. **Only this role can approve.** |
| **Viewer** | Read-only; no request/approve/transfer. |

Authentication: staff sign-in with username + password + MFA (authenticator code). Accounts are created by an Admin (no self-registration).

## 6. Financial model (price rules) — authoritative

**Sunda Commission = the "Sales" figure that must be registered on EFRIS.**

Per contract, per month (cycle), starting from **Collection** (reconciled gross water-fee collection for the contract's sources):

| Component | Rule | Running balance? |
|---|---|---|
| Sunda Commission | Per-contract % of collection. This is the taxable sales figure. | No (per cycle) |
| Initial fee | Payment before installation; sometimes deducted from collection. Paid down over time. | Yes — `initialFeeBalance` |
| Monthly fee | Fixed subscription + a percentage of collection. Deducted only when collection covers it; unpaid portion carries forward. Flag "covered or not". | Yes — `monthlyFeeBalance` |
| Maintenance fee | Usually a % of water-fee collection. | No (per cycle) |
| Bank charge | Applied only when the client's transfer method is bank. | No (per cycle) |
| Loan repayment | `min(monthlyRepayAmount, remaining loan balance)` per contract unit loan; never over-repays. | Yes — `loanBalance` |
| Shortage from previous month | Carried-forward unpaid amount from the prior cycle. | Yes (carry) |
| Other payments | Manual adjustments. | No (per cycle) |
| Additional transfer | Extra mid-month transfer when a client requests liquidation. Blocked if it exceeds collection after deducting commission. | No (per cycle) |

**Net transferred amount** = Collection − Sunda Commission − Initial-fee installment − Monthly fee − Maintenance fee − Bank charge − Loan repayment − Other payments, adjusted for carried shortage.

**Business guards:**
- If the net goes **below zero**, staff must first adjust other fees (monthly / initial) before "Submit for approval" becomes active.
- A month already flagged **"paid"** cannot be re-sent.
- **Multiple months** can be bundled into one payout.
- Payouts, fees and loans are computed **per contract**; a client with several loans shows each separately.

**Reports confirm the structure:** *Monthly Collection → Transfer-amount calculation → Initial-Fee balance calculation → Monthly-Fee balance calculation → Loan calculation.*

**Open (defaults pending Sunda confirmation):** exact commission %, the deduction order, and the precise "monthly fee covered or not" rule. See §21.

## 7. Functional requirements

| ID | Function | Priority |
|---|---|---|
| FR-01 | Dashboard + Yo!Uganda reconciliation | Must |
| FR-02 | Client registration (payment details, fees, contract) | Must |
| FR-03 | Client management (collection, fees, transfer calc) | Must |
| FR-04 | Payment/reconciliation status, approval, record | Must |
| FR-05 | Monthly client report | Must |
| FR-06 | Notifications (email / SMS / WhatsApp) | Could |
| FR-07 | System administration (account registration etc.) | Must |
| FR-08 | Sales registration & record (EFRIS) | Must |

## 8. Data model (entities)

Core entities (Prisma models):

- **User** — username, passwordHash, role (ADMIN/ACCOUNTANT/APPROVER/VIEWER), status, mfaSecret, lastLogin.
- **Client** — clientId, name, category, paymentFrequency, transferCondition, transferMethod (BANK/MOBILE_MONEY), reportFormat, status, registeredDate, firstPayoutDate. (1 Client → many Contracts.)
- **Contract** — contractId, client, tin, legalName, activePeriod (from/to), commissionPct, monthlyFeeFixed, monthlyFeePct, maintenanceFeePct, bankChargePerPayout, initialFee, initialFeeBalance, monthlyFeeBalance, source of truth terms. (1 Contract → many Sources; 1 Contract → 0..1 UnitLoan.)
- **Source** — sourceId (from main server), name, client, contract, status.
- **UnitLoan** — contract, unitType, totalPurchaseAmount, paymentPeriod, monthlyRepayAmount, initialPaymentPaid, balance, status (ACTIVE/CLEARED/OVERDUE/ON_HOLD), dueDate.
- **Collection** — source, client, contract, period (month), amount, litres, occurredAt, reference, source-of-record (yo|server), importBatch. (Raw records, kept.)
- **ReconMatch** — yoCollection, serverCollection, type (matched/mismatch/yo_only/server_only), diff, status (open/resolved/escalated), note.
- **PayoutCycle** — period, status (draft/calculating/ready/awaiting_approval/approved/paid). Holds the monthly run.
- **PayoutCalc** — cycle, client, contract, gross, commission, initialFee, monthlyFee, maintenanceFee, bankCharge, loanRepay, other, shortage, net, flags, ruleSnapshot, calcVersion, status. Append-only by version.
- **LoanEntry** — loan, calc, kind (disbursement/repayment/adjustment/reversal), amount, balanceAfter. Append-only.
- **Approval** — type (CYCLE/LOAN_ADJUSTMENT/RULE/DISBURSEMENT/REQUEST), maker, checker, status (pending/approved/rejected), reason.
- **PayoutRequest** — client, contract, requestedAmount, period, status (pending/approved/rejected/transferred), reason.
- **ManualPayment** — client, contract, purpose (INITIAL/UNIT/MONTHLY/OTHER), amount, date, receivedBy, method.
- **Disbursement** — batch, calc, idempotencyKey, amount, msisdn, yoRef, status (queued/sending/pending/success/failed/rejected/unknown), attempts, channel (MOBILE_MONEY/BANK).
- **EfrisSubmission** — recordType (COMMISSION/LOAN_REPAYMENT), record, payload, response, efrisRef, status (ready/submitted/approved/rejected), attempts.
- **Report** / **ReportFormat** — report category, recipient, items, format (PDF/Excel).
- **AuditLog** — actor, action, objectType, objectId, before, after, ip, at. Append-only.
- **RuleVersion** — kind, params (JSON), validFrom, validTo, status (draft/active/retired), approvedBy. (Versioned fee/commission parameters if Sunda wants them data-driven; otherwise per-contract.)

## 9. Calculation engine

Pure TypeScript module (`src/lib/calc/`), deterministic and unit-tested.

Inputs: a contract (with fee terms + loan), the reconciled collection for the cycle, prior running balances (initial fee, monthly fee, loan, shortage), and optional manual adjustments.

Algorithm (default order, configurable):
1. `gross` = reconciled collection for the contract's sources this cycle.
2. `commission` = contract.commissionPct × gross. (Sunda Commission = sales for EFRIS.)
3. `available` = gross − commission.
4. `loanRepay` = min(contract.monthlyRepayAmount, loan.balance), capped so it never exceeds `max(available, 0)`.
5. `maintenanceFee` = contract.maintenanceFeePct × gross.
6. `monthlyFee` = contract.monthlyFeeFixed + contract.monthlyFeePct × gross; **covered** if `available − loanRepay − maintenanceFee >= monthlyFee`; deduct what is covered, carry the rest as shortage; set `monthlyFeeCovered` flag.
7. `initialFeeInstallment` = the configured initial-fee installment, up to `initialFeeBalance` and up to remaining available.
8. `bankCharge` = contract.bankChargePerPayout if transferMethod = BANK else 0.
9. `other` = manual `otherPayments`.
10. Apply carried `shortageFromPreviousMonth`.
11. `net` = gross − commission − loanRepay − maintenanceFee − monthlyFeeDeducted − initialFeeInstallment − bankCharge − other − shortageApplied.
12. `flags`: open discrepancies, net ≤ 0 ("zero payout"), loan fully repaid, client on hold / missing payout phone, variance vs previous cycle.

Determinism: same inputs + same rule snapshot → same result. Recalculation creates a new `calcVersion`; approved/locked calcs are immutable (corrections via reversal).

Negative-net guard: "Submit for approval" is disabled until `net >= 0` after fee adjustments.

## 10. Reconciliation

Match SUNDA main-server collections against Yo!Uganda mobile-money records per period:
- **Pass 1 — exact reference:** match on a shared reference (open: confirm the matching key).
- **Pass 2 — heuristic:** same client, same amount, within a time window.
- **Pass 3 — amount tolerance:** same client + window but amount differs → "mismatch" with the diff.
- Leftovers → "yo_only" / "server_only"; duplicate references → "duplicate".

**Effective collected amount** = sum of matched + resolved amounts per client; held/open items excluded and flagged. One definition used everywhere (screens, reports, calculation).

**Discrepancy handling (per development doc):** out-of-system. The system **stores** the discrepancy and a note that it was escalated (for audit), but resolution is done by email to Yo!Uganda / the Japanese company — not an in-app maker-checker drawer. (Open: confirm the system should still store the note — see §21.)

## 11. Workflows, states and approvals

Maker-checker. Only Approver/Admin can approve; maker cannot approve their own work; rejection requires a reason.

Approval types:
- **Payout cycle** (monthly payout): Accountant submits → Approver approves → Accountant transfers.
- **Payout request** (mid-month liquidation): from mobile app → Accountant reviews → Approver approves → Accountant transfers. Mobile app blocks requests exceeding collection after commission.
- **Loan adjustment:** reason + note mandatory.
- **Disbursement batch** (Phase 3): authorises sending; total + count shown; second confirmation.
- **EFRIS registration:** Accountant reviews → Approver confirms → Accountant registers.

Monthly payout: calculated automatically at month-end; Accountant confirms → Approver confirms → Accountant transfers (mobile money) or marks done (bank).

**Open (§21):** whether a dedicated Approvals screen (S9) is kept or approval is folded inline into each screen.

## 12. Disbursement (Phase 3)

- **Mobile money:** via Yo!Uganda. Idempotent send: one disbursement row per approved payout with a unique idempotency key (`PO-{cycle}-{client}-{calcId}`) used as the client reference. Outcomes: success / pending (poll) / failed (no auto-resend) / rejected / unknown (query provider, never auto-resend). Authorisation: batch total + count, MFA second confirmation; daily/per-payout limits; kill switch; end-of-day reconciliation against Yo!Uganda.
- **Bank:** manual — Accountant goes to the bank, then sets the disbursement status to done in the system. (Exact status flow open — §21.)

## 13. EFRIS / Sales registration (Phase 4)

The Sunda Commission (= sales) and loan repayments are registered to EFRIS. Per the development doc this is **semi-manual**: the Accountant triggers a "Register EFRIS" action and downloads the registered EFRIS PDF. Records: `efris_submission` with payload, response, reference, status (ready/submitted/approved/rejected), attempts. Rejected items show the EFRIS reason; after correction (e.g. TIN) staff resubmit; every attempt kept.

(Open §21: button-trigger vs fully automatic API push — default: button-trigger.)

## 14. Mobile app integration

Shared REST API. Clients can: view real-time water usage and collections, view payout breakdowns, view loan payment history and balance, make a payment for water, and submit a payout (liquidation) request. The mobile app **blocks payout requests exceeding the water-collection amount after deducting Sunda's commission.** (Mobile client screens are out of scope for this internal build; the API contract is defined.)

## 15. Reports

Heavily customised per recipient/category. Standard reports (from the development doc):
1. Water collection & maintenance report (e.g. Kiryandongo / UNICEF).
2. Government report.
3. Private water vendor report (individuals).
4. ASP report.
5. Water vendor 3-month collection report (several loans under one client → show every loan repayment and balance).

Each report's items vary (total collection, monthly fee, additional transfer, maintenance fee, bank charge, transferred amount, loan repayment + balance list). Formats: PDF / Excel. Report formats are configurable per client ("Monthly report format"). All exports are logged.

## 16. SUNDA main server API integration

What the new system needs **from** the main server (the Rwanda spec received is kiosk-facing and minimal):

- **List collections** (new) — all water-fee collections for a period, per source/client, with amount, litres, time, reference. Drives reconciliation.
- **List customers** (new) — all clients with payout phone (msisdn) and status.
- **List sources** (new) — source name/ID and the client/contract each belongs to; per-source collection.
- **Customer profile enrichment** — add msisdn, TIN (per contract), site to the lookup.

Open (§21): whether the main server holds loan records (decides loan read endpoint vs one-time migration). Current leaning: the new system owns the loan ledger; only one-time opening balances are migrated.

Security/integration notes: add a service-level credential (not kiosk-based), pagination + date filters, incremental sync, higher rate limits; keep the timestamp-window + reference idempotency pattern; prefer HMAC-SHA256 over MD5.

## 17. UI screens (from the technical design, corrected)

Top bar (system name, notifications, user menu) + left nav grouped: Operations / Control / Phase 3–4 / Admin. Phase 3–4 hidden until enabled. Detail views: right drawer for quick tasks, full pages for complex ones.

Screens:
- **S1 Login** — username, password, MFA code; generic errors; no self-registration.
- **S2 Dashboard** — stage tracker (Import → Reconcile → Review → Calculate → Approve → Disburse → EFRIS); KPI cards (water collection, transfer amount, Sunda commission, pending approvals, active clients, liquidation requests, current month status); auto-updated 1st of each month.
- **S3 Clients list** — search by name/ID/code/site; filters; "+ Add Client", Import Excel; columns incl. active contracts/sources; alert if 0 active contracts.
- **S4 Client profile** — basic info; tabs: List of contracts, List of sources (by contract); right side: collection total (FY), paid loan, loan balance, Sunda commission (FY); history (payout, EFRIS). "+ Add Contract".
- **S4 Add Client / Add Contract** — register client (name/ID, transfer condition, payment frequency, transfer method, report format, category) and contract (ID, TIN/legal name, active period, monthly term, initial fee, monthly fee, maintenance fee, bank charge, unit terms, sources).
- **S5 Reconciliation** — counts by type; default filter "Discrepancies"; diff highlighted; per the dev doc, escalation is out-of-system (store note).
- **S6 Resolve discrepancy** — **removed per dev doc** (escalate by email). System stores the discrepancy + note only.
- **S7 Payout cycle** — two tabs (client-by-month, source-by-month); account type (MTN/Bank/Airtel); statuses (Need correction / Ready for authorisation / Under confirmation / Authorised); EFRIS status; report download tracked; authorize action.
- **S8 Payout breakdown** — itemised per contract; loan table per contract; multi-month allowed; "paid" months blocked; Download Excel; negative-net guard. Added: **Manual Payment Registration**.
- **S9 Approvals** — pending decision (§21). If kept: tabs Payout requests / Monthly payout / EFRIS, each All/Pending/Approved/Rejected; export Excel.
- **S10 Unit loans** — active loans qty, paid, outstanding; list (client, contract, unit amount, initial paid, repaid, balance, monthly repay, status); due dates; generate report.
- **S11 Payout requests** — list from mobile app; workflow (review → approve → transfer); mobile blocks over-collection; statuses All/Approved/Rejected/Transferred.
- **S12 Disbursements (Phase 3)** — stage tracker; per-payment reference/status/attempts; "Retry selected" only after review; unknown → "check status first".
- **S13 EFRIS / Sales (Phase 4)** — list of Sunda Commission per month; total; export; review → approve → "Register EFRIS" → download registered PDF.
- **S14 Rules & settings** — versioned rules; user list (name, email, category, status, last login); user categories Admin/Accountant/Approver/Viewer.
- **S15 Reports** — per-category report matrix; format selection; exports logged.
- **S16 Users & audit** — filter by user/action/date; before → after values; export.

Design system: Navy #0B4F7C primary; status colours (success/warning/error/info) never the only signal; Inter typography; tabular numerals; 8 px grid; WCAG 2.1 AA; desktop-first, tablet/phone read-only for staff.

## 18. Tech stack

- **Framework:** Next.js (App Router) — pages (UI) + Route Handlers (API).
- **Language:** TypeScript (strict).
- **ORM:** Prisma. Dev = SQLite (`file:./dev.db`); prod = PostgreSQL (`DATABASE_URL`).
- **Styling:** Tailwind CSS.
- **Auth:** session-based (bcrypt password hashing; MFA TOTP). (NextAuth can be added later.)
- **Testing:** Vitest for the calculation engine (pure-TS, no DB needed).
- **Async / integrations:** stubbed adapters for Yo!Uganda, EFRIS, and the SUNDA main server (mock implementations for dev).

## 19. Project structure

```
sunda-payout/
  docs/SPEC.md
  prisma/schema.prisma
  src/
    app/                       # Next.js App Router
      (auth)/login/
      layout.tsx, page.tsx
      clients/                 # S3, S4
      reconciliation/          # S5
      payout-cycle/            # S7, S8
      loans/                   # S10
      payouts/                 # S11
      disbursements/           # S12
      efris/                   # S13
      rules/                   # S14
      reports/                 # S15
      users/                   # S16
      api/                     # Route Handlers (REST)
    lib/
      calc/                    # calculation engine (pure TS)
      reconciliation/          # matching logic
      db.ts                    # prisma client
      auth.ts                  # auth + session
      adapters/                # yo-uganda, efris, sunda-server (mock)
      money.ts                 # integer-minor-unit helpers
      seed.ts
    components/                # shared UI (table, status pill, etc.)
  tests/calc/                  # vitest
```

## 20. Implementation plan (phases)

**Phase 0 — Foundation (this build):**
- Next.js + Prisma + SQLite; auth skeleton; layout/nav; design tokens.
- Prisma schema for all entities; migrations; seed data.
- Calculation engine (pure TS) + unit tests.
- Reconciliation logic (mock data) + REST API.
- Key UI screens (dashboard, clients, profile, payout cycle/breakdown, loans, approvals, reports) reading from the API.

**Phase 1 (next):** Real SUNDA main-server adapter (collections/customers/sources), RBAC enforcement, approvals workflow, audit log, reports export.

**Phase 2 (mobile app):** Mobile client + shared API for usage/breakdown/loan/requests.

**Phase 3 (Yo!Uganda):** Live disbursement integration, idempotency, status polling, kill switch.

**Phase 4 (EFRIS):** Sales/loan-repayment registration (button-trigger or live), status tracking, resubmission.

## 21. Open items / decisions needed before the calculator is final

1. **Exact fee percentages and amounts per contract** — the field set and numbers that make up a contract. (Each contract can differ.)
2. **Deduction order** and the **monthly-fee "covered or not" rule** — does the monthly fee always get deducted or only when collection covers it, and in what order vs loan/maintenance?
3. **Approvals screen (S9)** — keep a dedicated screen or fold approval inline?
4. **Discrepancy handling** — confirm the system stores the difference + an escalation note (for audit) even though resolution is by email.
5. **Bank disbursement status flow** and **EFRIS depth** — button-trigger vs fully automatic.

## 22. Out of scope / stubbed for later (Phase 0)

- Live Yo!Uganda, EFRIS, and SUNDA-main-server connections (mock adapters used).
- Async jobs / queues (the design doc's Celery+Redis equivalent) — Phase 0 uses synchronous calls.
- Full MFA enrolment flow (skeleton only).
- Mobile client app (API contract defined; client not built).
- Production hardening: rate limiting, secrets vault, observability, backup/restore, CI/CD.
- PostgreSQL migration (SQLite for dev; Prisma makes the switch a config change).

---

*This spec reconciles the development doc (dominant) with the technical design (UI). Build proceeds per §20.*
