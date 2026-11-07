// ─────────────────────────────────────────────────────────────────────────────
// Mock data — SAD v1.0 (3 Nov 2026) aligned.
// Authoritative source order: Development.docx (dominant) → SAD document.
// Money: integer UGX. Dates: ISO strings in EAT context.
// ─────────────────────────────────────────────────────────────────────────────

// ── Enums / union types ───────────────────────────────────────────────────────
export type ClientCategory =
  | "ASP"
  | "Private Water Vendor"
  | "Private Operator"
  | "Sunda Direct Management"
  | "Community Management"
  | "Donor";

export type TransferMethod = "MOBILE_MONEY" | "BANK";
export type Status = "ACTIVE" | "INACTIVE";
export type LoanStatus = "ACTIVE" | "CLEARED" | "OVERDUE" | "ON_HOLD";
export type MaintenanceFeeType = "PERCENTAGE" | "FIXED_MONTHLY" | "PER_EVENT";

// SAD §7.1 lifecycle (replaces the old draft/calculating/ready set)
export type PayoutStatementStatus =
  | "waiting_for_transfer_month"   // month not yet closed
  | "calculated_draft"             // auto-generated after month end
  | "under_confirmation"           // accountant reviewing
  | "needs_correction"             // rejected or error found
  | "ready_for_authorisation"      // submitted for approval
  | "authorised"                   // approved by Approver/Admin
  | "transferred";                 // money sent; paid flag set; month locked

export type CycleStatus = "open" | "awaiting_approval" | "approved" | "paid";
export type ReconType = "matched" | "mismatch" | "yo_only" | "server_only" | "duplicate";
export type ReconStatus = "resolved" | "open" | "escalated";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type ApprovalType =
  | "PAYOUT_CYCLE"
  | "LOAN_ADJUSTMENT"
  | "RULE"
  | "DISBURSEMENT"
  | "PAYOUT_REQUEST"
  | "EFRIS";

// SAD §2.2 — commission categories that feed EFRIS
export type CommissionCategory =
  | "INITIAL_FEE"
  | "MONTHLY_FEE"
  | "ADDITIONAL_TRANSFER"
  | "MAINTENANCE_FEE"
  | "BANK_CHARGE";

// ── Source ────────────────────────────────────────────────────────────────────
export interface Source {
  id: string;
  sourceId: string;        // from SUNDA main server
  name: string;
  clientId: string;
  contractId: string | null; // null = non-registered source (SAD §3.5)
  status: Status;
}

// ── Contract term version (SAD §5.2 — versioned terms) ───────────────────────
export interface ContractTermVersion {
  id: string;
  contractId: string;
  validFrom: string;
  validTo: string | null;
  commissionPct: number;
  monthlyFeeFixed: number;
  monthlyFeePct: number;
  maintenanceFeeType: MaintenanceFeeType;
  maintenanceFeeValue: number;  // pct if PERCENTAGE, UGX if FIXED_MONTHLY/PER_EVENT
  bankChargePerPayout: number;
  initialFeeDeductFromCollection: boolean;
}

// ── UnitLoan ──────────────────────────────────────────────────────────────────
export interface LoanEntry {
  id: string;
  kind: "disbursement" | "repayment" | "adjustment" | "reversal";
  amount: number;
  balanceAfter: number;
  note: string;
  createdAt: string;
}

export interface UnitLoan {
  id: string;
  contractId: string;
  unitType: string;
  totalPurchaseAmount: number;
  paymentPeriod: number;           // months
  monthlyRepayAmount: number;
  initialPaymentPaid: number;
  balance: number;                 // outstanding
  status: LoanStatus;
  dueDate: string;
  entries: LoanEntry[];
}

// ── Contract ──────────────────────────────────────────────────────────────────
export interface Contract {
  id: string;
  contractId: string;
  clientId: string;
  tin: string;
  legalName: string;
  activeFrom: string;
  activeTo: string;
  // Active term (denormalised for easy calc use)
  commissionPct: number;
  monthlyFeeFixed: number;
  monthlyFeePct: number;
  maintenanceFeeType: MaintenanceFeeType;
  maintenanceFeeValue: number;
  bankChargePerPayout: number;
  initialFeeInstallment: number;
  initialFee: number;
  initialFeeBalance: number;         // running balance
  monthlyFeeBalance: number;         // carried shortage
  initialFeeDeductFromCollection: boolean;
  termVersions: ContractTermVersion[];
  unitLoan: UnitLoan | null;
  sources: Source[];
}

// ── Client ────────────────────────────────────────────────────────────────────
export interface Client {
  id: string;
  clientId: string;
  name: string;
  category: ClientCategory;
  paymentFrequency: "MONTHLY" | "QUARTERLY";
  firstPayoutMonth: string | null;   // SAD §5.2
  transferMethod: TransferMethod;
  payoutPhone: string | null;
  bankAccount: string | null;
  reportFormat: string;
  status: Status;
  registeredDate: string;
  contracts: Contract[];
  sources: Source[];                 // includes non-registered (contractId = null)
}

// ── Collection (Yo!Uganda / Sunda server) — SAD §8.3 fields ──────────────────
export interface Collection {
  id: string;
  sourceId: string;
  clientId: string;
  sourceOfRecord: "yo" | "server";
  // Yo!Uganda specific fields (SAD §8.3)
  txnId: string;           // YP1375581515TX
  operatorRef: string;     // 126061143178
  senderMsisdn: string;    // 256757099887
  operator: string;        // AIRTEL UGANDA LTD
  narrative: string;
  extRef: string;          // 126029147 — maps to source on Sunda server
  amount: number;
  litres: number;
  occurredAt: string;
}

// ── ReconMatch — SAD §7.4 (attribute-level comparison) ───────────────────────
export interface ReconClientTotals {
  clientId: string;
  clientName: string;
  yoTotal: number;
  serverTotal: number;
  diff: number;
  txnCountYo: number;
  txnCountServer: number;
}

export interface ReconMatch {
  id: string;
  type: ReconType;
  status: ReconStatus;
  yoAmount: number | null;
  serverAmount: number | null;
  diff: number;
  clientName: string;
  sourceName: string;
  extRef: string;
  occurredAt: string;
  note: string | null;
  // SAD §8.3 attribute-level fields
  txnId: string | null;
  operatorRef: string | null;
  senderMsisdn: string | null;
  operator: string | null;
  mismatchReasons: string[];  // e.g. ["amount_diff", "operator_mismatch"]
}

// ── Manual payment (SAD §5.2 entity) ─────────────────────────────────────────
export interface ManualPayment {
  id: string;
  clientId: string;
  clientName: string;
  contractId: string;
  contractRef: string;
  purpose: "INITIAL_FEE" | "UNIT_FEE" | "MONTHLY_FEE" | "OTHER";
  amount: number;
  date: string;
  receivedBy: string;
  method: "CASH" | "BANK" | "MOBILE_MONEY";
  note: string;
}

// ── Sales record (SAD §5.2 / §7.3 — per category for EFRIS) ─────────────────
export interface SalesRecord {
  id: string;
  clientId: string;
  clientName: string;
  contractRef: string;
  period: string;
  category: CommissionCategory;
  amount: number;
  status: "pending" | "approval_requested" | "approved" | "rejected" | "efris_registered";
  efrisRef: string | null;
  invoiceNumber: string | null;
  approvedBy: string | null;
  createdAt: string;
}

// ── PayoutCalc — SAD §6.2 formula fields ─────────────────────────────────────
export interface PayoutCalc {
  id: string;
  clientId: string;
  clientName: string;
  contractId: string;
  contractRef: string;
  period: string;
  // SAD §6.2 formula components
  gross: number;
  initialFee: number;
  monthlyFee: number;
  maintenanceFee: number;
  bankCharge: number;
  loanRepay: number;
  additionalTransfer: number;      // mid-month advances already paid (SAD §6.1)
  shortage: number;                // carried from previous month
  other: number;
  net: number;
  // Derived commission (= initial + monthly + additional + maintenance + bank — all are Sunda commission)
  commission: number;
  monthlyFeeCovered: boolean;
  flags: string[];
  // SAD §7.1 lifecycle
  status: PayoutStatementStatus;
  transferStatus: "not_transferred" | "transferred" | "failed";
  transferredAt: string | null;
  transferredBy: string | null;
  accountType: "MTN" | "AIRTEL" | "BANK";
}

// ── PayoutCycle ───────────────────────────────────────────────────────────────
export interface PayoutCycle {
  id: string;
  period: string;
  status: CycleStatus;
  calcs: PayoutCalc[];
}

// ── Approval ──────────────────────────────────────────────────────────────────
export interface Approval {
  id: string;
  type: ApprovalType;
  objectRef: string;
  maker: string;
  checker: string | null;
  status: ApprovalStatus;
  reason: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

// ── PayoutRequest ─────────────────────────────────────────────────────────────
export interface PayoutRequest {
  id: string;
  clientId: string;
  clientName: string;
  contractRef: string;
  requestedAmount: number;
  availableAmount: number;        // SAD §7.2 — system enforces ≤ this
  period: string;
  status: "pending" | "approved" | "rejected" | "transferred";
  reason: string | null;
  createdAt: string;
  idempotencyKey: string;
}

// ── EfrisSubmission ───────────────────────────────────────────────────────────
export interface EfrisSubmission {
  id: string;
  recordType: "COMMISSION" | "LOAN_REPAYMENT";
  clientName: string;
  contractRef: string;
  amount: number;
  period: string;
  status: "ready" | "submitted" | "approved" | "rejected";
  efrisRef: string | null;
  invoiceNumber: string | null;
  attempts: number;
  createdAt: string;
}

// ── User ──────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  username: string;
  role: "ADMIN" | "ACCOUNTANT" | "APPROVER" | "VIEWER";
  status: Status;
  lastLogin: string;
}

// ── Report format (SAD §6.5 / §9.1) ─────────────────────────────────────────
export interface ReportFormat {
  id: string;
  name: string;
  elements: ("COLLECTION" | "TRANSFER_CALC" | "INITIAL_FEE_BALANCE" | "MONTHLY_FEE_BALANCE" | "LOAN_CALC")[];
  outputFormats: ("PDF" | "EXCEL")[];
  assignedClients: string[];   // clientIds
}

// ═════════════════════════════════════════════════════════════════════════════
// Data
// ═════════════════════════════════════════════════════════════════════════════

export const SOURCES: Source[] = [
  { id: "src-1", sourceId: "KIR-001", name: "Kiryandongo Borehole",  clientId: "c1", contractId: "con1", status: "ACTIVE" },
  { id: "src-2", sourceId: "KIR-002", name: "Kiryandongo Tap Stand", clientId: "c1", contractId: "con1", status: "ACTIVE" },
  { id: "src-3", sourceId: "GOM-001", name: "Gomba Tap Stand A",     clientId: "c2", contractId: "con2", status: "ACTIVE" },
  { id: "src-4", sourceId: "BUT-001", name: "Butambala Kiosk",        clientId: "c3", contractId: "con3", status: "ACTIVE" },
  { id: "src-5", sourceId: "MAT-001", name: "Matoogo Water Point",    clientId: "c4", contractId: "con4", status: "INACTIVE" },
  // SAD §3.5: non-registered source (contractId = null) — detected from Sunda main server
  { id: "src-6", sourceId: "KIR-003", name: "Kiryandongo New Tap",   clientId: "c1", contractId: null,   status: "ACTIVE" },
];

const CON1_TERMS: ContractTermVersion[] = [
  {
    id: "tv-1a", contractId: "con1",
    validFrom: "2024-01-15", validTo: "2025-12-31",
    commissionPct: 0.18, monthlyFeeFixed: 45_000, monthlyFeePct: 0.05,
    maintenanceFeeType: "PERCENTAGE", maintenanceFeeValue: 0.09,
    bankChargePerPayout: 0, initialFeeDeductFromCollection: true,
  },
  {
    id: "tv-1b", contractId: "con1",
    validFrom: "2026-01-01", validTo: null,
    commissionPct: 0.20, monthlyFeeFixed: 50_000, monthlyFeePct: 0.05,
    maintenanceFeeType: "PERCENTAGE", maintenanceFeeValue: 0.10,
    bankChargePerPayout: 0, initialFeeDeductFromCollection: true,
  },
];

export const CLIENTS: Client[] = [
  {
    id: "c1", clientId: "C-1001", name: "Kiryandongo Water Ltd",
    category: "ASP", paymentFrequency: "MONTHLY", firstPayoutMonth: "2024-02",
    transferMethod: "MOBILE_MONEY", payoutPhone: "256757099887", bankAccount: null,
    reportFormat: "Water collection & maintenance", status: "ACTIVE", registeredDate: "2024-01-15",
    sources: SOURCES.filter((s) => s.clientId === "c1"),
    contracts: [
      {
        id: "con1", contractId: "CON-1001", clientId: "c1",
        tin: "1000000001", legalName: "Kiryandongo Water Ltd",
        activeFrom: "2024-01-15", activeTo: "2027-01-14",
        commissionPct: 0.20, monthlyFeeFixed: 50_000, monthlyFeePct: 0.05,
        maintenanceFeeType: "PERCENTAGE", maintenanceFeeValue: 0.10,
        bankChargePerPayout: 0,
        initialFeeInstallment: 50_000, initialFee: 200_000,
        initialFeeBalance: 100_000, monthlyFeeBalance: 0,
        initialFeeDeductFromCollection: true,
        termVersions: CON1_TERMS,
        sources: SOURCES.filter((s) => s.contractId === "con1"),
        unitLoan: {
          id: "loan-1", contractId: "con1",
          unitType: "Water Kiosk Unit",
          totalPurchaseAmount: 4_800_000, paymentPeriod: 16,
          monthlyRepayAmount: 300_000, initialPaymentPaid: 0,
          balance: 4_200_000, status: "ACTIVE", dueDate: "2027-08-31",
          entries: [
            { id: "le-1", kind: "disbursement", amount: 4_800_000, balanceAfter: 4_800_000, note: "Initial disbursement", createdAt: "2024-01-15" },
            { id: "le-2", kind: "repayment",    amount: 300_000,   balanceAfter: 4_500_000, note: "Payout 2026-07", createdAt: "2026-07-02" },
            { id: "le-3", kind: "repayment",    amount: 300_000,   balanceAfter: 4_200_000, note: "Payout 2026-08", createdAt: "2026-08-02" },
          ],
        },
      },
    ],
  },
  {
    id: "c2", clientId: "C-1002", name: "Gomba Community Water",
    category: "Community Management", paymentFrequency: "MONTHLY", firstPayoutMonth: "2024-04",
    transferMethod: "BANK", payoutPhone: null, bankAccount: "0140001234567",
    reportFormat: "Government", status: "ACTIVE", registeredDate: "2024-03-01",
    sources: SOURCES.filter((s) => s.clientId === "c2"),
    contracts: [
      {
        id: "con2", contractId: "CON-1002", clientId: "c2",
        tin: "1000000002", legalName: "Gomba Community Water Board",
        activeFrom: "2024-03-01", activeTo: "2027-02-28",
        commissionPct: 0.15, monthlyFeeFixed: 0, monthlyFeePct: 0.03,
        maintenanceFeeType: "FIXED_MONTHLY", maintenanceFeeValue: 20_000,
        bankChargePerPayout: 5_000,
        initialFeeInstallment: 30_000, initialFee: 100_000,
        initialFeeBalance: 70_000, monthlyFeeBalance: 0,
        initialFeeDeductFromCollection: false,
        termVersions: [{ id: "tv-2a", contractId: "con2", validFrom: "2024-03-01", validTo: null, commissionPct: 0.15, monthlyFeeFixed: 0, monthlyFeePct: 0.03, maintenanceFeeType: "FIXED_MONTHLY", maintenanceFeeValue: 20_000, bankChargePerPayout: 5_000, initialFeeDeductFromCollection: false }],
        sources: SOURCES.filter((s) => s.contractId === "con2"),
        unitLoan: {
          id: "loan-2", contractId: "con2",
          unitType: "Water Unit",
          totalPurchaseAmount: 1_000_000, paymentPeriod: 10,
          monthlyRepayAmount: 100_000, initialPaymentPaid: 0,
          balance: 600_000, status: "ACTIVE", dueDate: "2027-01-31",
          entries: [
            { id: "le-4", kind: "disbursement", amount: 1_000_000, balanceAfter: 1_000_000, note: "Initial", createdAt: "2024-03-01" },
            { id: "le-5", kind: "repayment",    amount: 100_000,   balanceAfter: 900_000,   note: "Payout 2026-06", createdAt: "2026-06-02" },
            { id: "le-6", kind: "repayment",    amount: 100_000,   balanceAfter: 800_000,   note: "Payout 2026-07", createdAt: "2026-07-02" },
            { id: "le-7", kind: "repayment",    amount: 100_000,   balanceAfter: 700_000,   note: "Payout 2026-08", createdAt: "2026-08-02" },
            { id: "le-8", kind: "repayment",    amount: 100_000,   balanceAfter: 600_000,   note: "Payout 2026-09", createdAt: "2026-09-02" },
          ],
        },
      },
    ],
  },
  {
    id: "c3", clientId: "C-1003", name: "Butambala UNICEF Project",
    category: "Donor", paymentFrequency: "MONTHLY", firstPayoutMonth: "2025-02",
    transferMethod: "BANK", payoutPhone: null, bankAccount: "0150009876543",
    reportFormat: "Water collection & maintenance", status: "ACTIVE", registeredDate: "2025-01-10",
    sources: SOURCES.filter((s) => s.clientId === "c3"),
    contracts: [
      {
        id: "con3", contractId: "CON-1003", clientId: "c3",
        tin: "1000000003", legalName: "UNICEF Uganda",
        activeFrom: "2025-01-10", activeTo: "2028-01-09",
        commissionPct: 0.18, monthlyFeeFixed: 30_000, monthlyFeePct: 0.04,
        maintenanceFeeType: "PERCENTAGE", maintenanceFeeValue: 0.07,
        bankChargePerPayout: 5_000,
        initialFeeInstallment: 20_000, initialFee: 80_000,
        initialFeeBalance: 40_000, monthlyFeeBalance: 0,
        initialFeeDeductFromCollection: false,
        termVersions: [{ id: "tv-3a", contractId: "con3", validFrom: "2025-01-10", validTo: null, commissionPct: 0.18, monthlyFeeFixed: 30_000, monthlyFeePct: 0.04, maintenanceFeeType: "PERCENTAGE", maintenanceFeeValue: 0.07, bankChargePerPayout: 5_000, initialFeeDeductFromCollection: false }],
        sources: SOURCES.filter((s) => s.contractId === "con3"),
        unitLoan: null,
      },
    ],
  },
  {
    id: "c4", clientId: "C-1004", name: "Matoogo Water Vendors",
    category: "Private Water Vendor", paymentFrequency: "QUARTERLY", firstPayoutMonth: "2023-09",
    transferMethod: "MOBILE_MONEY", payoutPhone: "256702345678", bankAccount: null,
    reportFormat: "Water vendor 3-month", status: "INACTIVE", registeredDate: "2023-06-20",
    sources: SOURCES.filter((s) => s.clientId === "c4"),
    contracts: [
      {
        id: "con4", contractId: "CON-1004", clientId: "c4",
        tin: "1000000004", legalName: "Matoogo Water Vendors Association",
        activeFrom: "2023-06-20", activeTo: "2024-06-19",
        commissionPct: 0.22, monthlyFeeFixed: 0, monthlyFeePct: 0.06,
        maintenanceFeeType: "PER_EVENT", maintenanceFeeValue: 50_000,
        bankChargePerPayout: 0,
        initialFeeInstallment: 0, initialFee: 0,
        initialFeeBalance: 0, monthlyFeeBalance: 15_000,
        initialFeeDeductFromCollection: false,
        termVersions: [{ id: "tv-4a", contractId: "con4", validFrom: "2023-06-20", validTo: "2024-06-19", commissionPct: 0.22, monthlyFeeFixed: 0, monthlyFeePct: 0.06, maintenanceFeeType: "PER_EVENT", maintenanceFeeValue: 50_000, bankChargePerPayout: 0, initialFeeDeductFromCollection: false }],
        sources: SOURCES.filter((s) => s.contractId === "con4"),
        unitLoan: null,
      },
    ],
  },
];

// ── Reconciliation data (SAD §8.3 Yo!Uganda fields) ───────────────────────────
export const RECON_MATCHES: ReconMatch[] = [
  { id: "rm-1", type: "matched",     status: "resolved", yoAmount: 250_000, serverAmount: 250_000, diff: 0,         clientName: "Kiryandongo Water Ltd",  sourceName: "KIR-001", extRef: "REF-KIR-1", occurredAt: "2026-09-03", note: null, txnId: "YP1375581515TX", operatorRef: "126061143178", senderMsisdn: "256757099887", operator: "AIRTEL UGANDA LTD",    mismatchReasons: [] },
  { id: "rm-2", type: "matched",     status: "resolved", yoAmount: 300_000, serverAmount: 300_000, diff: 0,         clientName: "Kiryandongo Water Ltd",  sourceName: "KIR-001", extRef: "REF-KIR-2", occurredAt: "2026-09-05", note: null, txnId: "YP1375581516TX", operatorRef: "126061143179", senderMsisdn: "256700112233", operator: "MTN UGANDA LTD",       mismatchReasons: [] },
  { id: "rm-3", type: "mismatch",    status: "open",     yoAmount: 200_000, serverAmount: 180_000, diff: 20_000,    clientName: "Kiryandongo Water Ltd",  sourceName: "KIR-002", extRef: "REF-KIR-3", occurredAt: "2026-09-08", note: null, txnId: "YP1375581520TX", operatorRef: "126061143180", senderMsisdn: "256702445566", operator: "AIRTEL UGANDA LTD",    mismatchReasons: ["amount_diff"] },
  { id: "rm-4", type: "yo_only",     status: "open",     yoAmount: 150_000, serverAmount: null,    diff: 150_000,   clientName: "Kiryandongo Water Ltd",  sourceName: "KIR-002", extRef: "REF-KIR-4", occurredAt: "2026-09-12", note: null, txnId: "YP1375581521TX", operatorRef: "126061143181", senderMsisdn: "256703334455", operator: "MTN UGANDA LTD",       mismatchReasons: ["yo_only"] },
  { id: "rm-5", type: "matched",     status: "resolved", yoAmount: 100_000, serverAmount: 100_000, diff: 0,         clientName: "Gomba Community Water",  sourceName: "GOM-001", extRef: "REF-GOM-1", occurredAt: "2026-09-04", note: null, txnId: "YP1375581530TX", operatorRef: "126061143190", senderMsisdn: "256754112233", operator: "MTN UGANDA LTD",       mismatchReasons: [] },
  { id: "rm-6", type: "matched",     status: "resolved", yoAmount: 90_000,  serverAmount: 90_000,  diff: 0,         clientName: "Gomba Community Water",  sourceName: "GOM-001", extRef: "REF-GOM-2", occurredAt: "2026-09-09", note: null, txnId: "YP1375581531TX", operatorRef: "126061143191", senderMsisdn: "256754112244", operator: "AIRTEL UGANDA LTD",    mismatchReasons: [] },
  { id: "rm-7", type: "server_only", status: "open",     yoAmount: null,    serverAmount: 70_000,  diff: -70_000,   clientName: "Gomba Community Water",  sourceName: "GOM-001", extRef: "REF-GOM-3", occurredAt: "2026-09-14", note: null, txnId: null,             operatorRef: null,           senderMsisdn: null,           operator: null,                   mismatchReasons: ["server_only"] },
  { id: "rm-8", type: "matched",     status: "resolved", yoAmount: 350_000, serverAmount: 350_000, diff: 0,         clientName: "Butambala UNICEF Project",sourceName: "BUT-001", extRef: "REF-BUT-1", occurredAt: "2026-09-06", note: null, txnId: "YP1375581540TX", operatorRef: "126061143200", senderMsisdn: "256701223344", operator: "MTN UGANDA LTD",       mismatchReasons: [] },
  { id: "rm-9", type: "matched",     status: "resolved", yoAmount: 280_000, serverAmount: 280_000, diff: 0,         clientName: "Butambala UNICEF Project",sourceName: "BUT-001", extRef: "REF-BUT-2", occurredAt: "2026-09-11", note: null, txnId: "YP1375581541TX", operatorRef: "126061143201", senderMsisdn: "256701223355", operator: "AIRTEL UGANDA LTD",    mismatchReasons: [] },
];

// Derived per-client totals (SAD §7.4)
export const RECON_CLIENT_TOTALS: ReconClientTotals[] = [
  { clientId: "c1", clientName: "Kiryandongo Water Ltd",   yoTotal: 900_000,  serverTotal: 730_000,  diff: 170_000, txnCountYo: 4, txnCountServer: 3 },
  { clientId: "c2", clientName: "Gomba Community Water",   yoTotal: 190_000,  serverTotal: 260_000,  diff: -70_000, txnCountYo: 2, txnCountServer: 3 },
  { clientId: "c3", clientName: "Butambala UNICEF Project", yoTotal: 630_000, serverTotal: 630_000,  diff: 0,       txnCountYo: 2, txnCountServer: 2 },
];

// ── Payout cycle — SAD §7.1 statuses ─────────────────────────────────────────
export const PAYOUT_CYCLE: PayoutCycle = {
  id: "cyc-1",
  period: "2026-09",
  status: "awaiting_approval",
  calcs: [
    {
      id: "pc-1", clientId: "c1", clientName: "Kiryandongo Water Ltd",
      contractId: "con1", contractRef: "CON-1001", period: "2026-09",
      gross: 1_250_000,
      commission: 487_500,  // sum of all commission components below
      initialFee: 50_000,
      monthlyFee: 112_500,  // 50,000 + 5% × 1,250,000
      maintenanceFee: 125_000, // 10% × 1,250,000
      bankCharge: 0,
      loanRepay: 300_000,
      additionalTransfer: 200_000, // mid-month advance already paid
      shortage: 0, other: 0,
      net: 262_500,  // 1,250,000 − 50,000 − 112,500 − 125,000 − 300,000 − 200,000 − 200,000(commission)
      monthlyFeeCovered: true,
      flags: [],
      status: "ready_for_authorisation",
      transferStatus: "not_transferred", transferredAt: null, transferredBy: null,
      accountType: "MTN",
    },
    {
      id: "pc-2", clientId: "c2", clientName: "Gomba Community Water",
      contractId: "con2", contractRef: "CON-1002", period: "2026-09",
      gross: 260_000,
      commission: 72_800,   // 15% gross + fixed maintenance + bank
      initialFee: 30_000,
      monthlyFee: 7_800,    // 3% × 260,000
      maintenanceFee: 20_000, // fixed monthly
      bankCharge: 5_000,
      loanRepay: 100_000,
      additionalTransfer: 0,
      shortage: 0, other: 0,
      net: 57_200,
      monthlyFeeCovered: true,
      flags: [],
      status: "ready_for_authorisation",
      transferStatus: "not_transferred", transferredAt: null, transferredBy: null,
      accountType: "BANK",
    },
    {
      id: "pc-3", clientId: "c3", clientName: "Butambala UNICEF Project",
      contractId: "con3", contractRef: "CON-1003", period: "2026-09",
      gross: 630_000,
      commission: 192_300,  // 18% + monthly + maintenance + bank
      initialFee: 20_000,
      monthlyFee: 55_200,   // 30,000 + 4% × 630,000
      maintenanceFee: 44_100, // 7% × 630,000
      bankCharge: 5_000,
      loanRepay: 0,
      additionalTransfer: 0,
      shortage: 0, other: 0,
      net: 505_500,
      monthlyFeeCovered: true,
      flags: [],
      status: "under_confirmation",
      transferStatus: "not_transferred", transferredAt: null, transferredBy: null,
      accountType: "BANK",
    },
  ],
};

// Historical cycles (for the dashboard 12-month chart)
export const HISTORICAL_CYCLES: { period: string; collection: number; registeredSales: number }[] = [
  { period: "2025-10", collection: 1_600_000, registeredSales: 320_000 },
  { period: "2025-11", collection: 1_750_000, registeredSales: 350_000 },
  { period: "2025-12", collection: 1_900_000, registeredSales: 380_000 },
  { period: "2026-01", collection: 1_550_000, registeredSales: 310_000 },
  { period: "2026-02", collection: 1_480_000, registeredSales: 296_000 },
  { period: "2026-03", collection: 1_720_000, registeredSales: 344_000 },
  { period: "2026-04", collection: 1_830_000, registeredSales: 366_000 },
  { period: "2026-05", collection: 2_010_000, registeredSales: 402_000 },
  { period: "2026-06", collection: 1_960_000, registeredSales: 392_000 },
  { period: "2026-07", collection: 2_100_000, registeredSales: 420_000 },
  { period: "2026-08", collection: 2_050_000, registeredSales: 410_000 },
  { period: "2026-09", collection: 2_140_000, registeredSales: 0 },  // not yet registered
];

// ── Sales records — broken down by commission category (SAD §2.2 / §7.3) ─────
export const SALES_RECORDS: SalesRecord[] = [
  // Sep 2026 — pending approval
  { id: "sr-1",  clientId: "c1", clientName: "Kiryandongo Water Ltd",   contractRef: "CON-1001", period: "2026-09", category: "INITIAL_FEE",         amount: 50_000,  status: "approval_requested", efrisRef: null, invoiceNumber: null, approvedBy: null, createdAt: "2026-10-02" },
  { id: "sr-2",  clientId: "c1", clientName: "Kiryandongo Water Ltd",   contractRef: "CON-1001", period: "2026-09", category: "MONTHLY_FEE",          amount: 112_500, status: "approval_requested", efrisRef: null, invoiceNumber: null, approvedBy: null, createdAt: "2026-10-02" },
  { id: "sr-3",  clientId: "c1", clientName: "Kiryandongo Water Ltd",   contractRef: "CON-1001", period: "2026-09", category: "ADDITIONAL_TRANSFER",  amount: 25_000,  status: "approval_requested", efrisRef: null, invoiceNumber: null, approvedBy: null, createdAt: "2026-10-02" },
  { id: "sr-4",  clientId: "c1", clientName: "Kiryandongo Water Ltd",   contractRef: "CON-1001", period: "2026-09", category: "MAINTENANCE_FEE",      amount: 125_000, status: "approval_requested", efrisRef: null, invoiceNumber: null, approvedBy: null, createdAt: "2026-10-02" },
  { id: "sr-5",  clientId: "c2", clientName: "Gomba Community Water",   contractRef: "CON-1002", period: "2026-09", category: "MONTHLY_FEE",          amount: 27_800,  status: "approval_requested", efrisRef: null, invoiceNumber: null, approvedBy: null, createdAt: "2026-10-02" },
  { id: "sr-6",  clientId: "c2", clientName: "Gomba Community Water",   contractRef: "CON-1002", period: "2026-09", category: "MAINTENANCE_FEE",      amount: 20_000,  status: "approval_requested", efrisRef: null, invoiceNumber: null, approvedBy: null, createdAt: "2026-10-02" },
  { id: "sr-7",  clientId: "c2", clientName: "Gomba Community Water",   contractRef: "CON-1002", period: "2026-09", category: "BANK_CHARGE",          amount: 5_000,   status: "approval_requested", efrisRef: null, invoiceNumber: null, approvedBy: null, createdAt: "2026-10-02" },
  { id: "sr-8",  clientId: "c3", clientName: "Butambala UNICEF Project", contractRef: "CON-1003", period: "2026-09", category: "MONTHLY_FEE",         amount: 55_200,  status: "pending",            efrisRef: null, invoiceNumber: null, approvedBy: null, createdAt: "2026-10-02" },
  { id: "sr-9",  clientId: "c3", clientName: "Butambala UNICEF Project", contractRef: "CON-1003", period: "2026-09", category: "MAINTENANCE_FEE",     amount: 44_100,  status: "pending",            efrisRef: null, invoiceNumber: null, approvedBy: null, createdAt: "2026-10-02" },
  { id: "sr-10", clientId: "c3", clientName: "Butambala UNICEF Project", contractRef: "CON-1003", period: "2026-09", category: "BANK_CHARGE",         amount: 5_000,   status: "pending",            efrisRef: null, invoiceNumber: null, approvedBy: null, createdAt: "2026-10-02" },
  // Aug 2026 — EFRIS registered
  { id: "sr-11", clientId: "c1", clientName: "Kiryandongo Water Ltd",   contractRef: "CON-1001", period: "2026-08", category: "MONTHLY_FEE",          amount: 108_000, status: "efris_registered",   efrisRef: "EFRIS-2026-0801", invoiceNumber: "INV-2026-0801", approvedBy: "aya", createdAt: "2026-09-03" },
  { id: "sr-12", clientId: "c1", clientName: "Kiryandongo Water Ltd",   contractRef: "CON-1001", period: "2026-08", category: "MAINTENANCE_FEE",      amount: 120_000, status: "efris_registered",   efrisRef: "EFRIS-2026-0802", invoiceNumber: "INV-2026-0802", approvedBy: "aya", createdAt: "2026-09-03" },
  { id: "sr-13", clientId: "c2", clientName: "Gomba Community Water",   contractRef: "CON-1002", period: "2026-08", category: "MONTHLY_FEE",          amount: 26_400,  status: "rejected",           efrisRef: null, invoiceNumber: null, approvedBy: null, createdAt: "2026-09-03" },
];

// ── Manual payments (SAD §5.2) ────────────────────────────────────────────────
export const MANUAL_PAYMENTS: ManualPayment[] = [
  { id: "mp-1", clientId: "c1", clientName: "Kiryandongo Water Ltd",   contractId: "con1", contractRef: "CON-1001", purpose: "INITIAL_FEE", amount: 50_000,  date: "2026-09-10", receivedBy: "maiki", method: "CASH",         note: "Cash payment at office" },
  { id: "mp-2", clientId: "c2", clientName: "Gomba Community Water",   contractId: "con2", contractRef: "CON-1002", purpose: "MONTHLY_FEE", amount: 27_800,  date: "2026-09-15", receivedBy: "maiki", method: "BANK",         note: "Bank deposit ref 12345" },
  { id: "mp-3", clientId: "c3", clientName: "Butambala UNICEF Project", contractId: "con3", contractRef: "CON-1003", purpose: "UNIT_FEE",   amount: 100_000, date: "2026-08-20", receivedBy: "maiki", method: "MOBILE_MONEY", note: "MTN payment" },
];

// ── Approvals ─────────────────────────────────────────────────────────────────
export const APPROVALS: Approval[] = [
  { id: "ap-1", type: "PAYOUT_CYCLE",  objectRef: "CON-1001 / Sep 2026", maker: "maiki", checker: null,  status: "pending",  reason: null, createdAt: "2026-10-02", resolvedAt: null },
  { id: "ap-2", type: "PAYOUT_CYCLE",  objectRef: "CON-1002 / Sep 2026", maker: "maiki", checker: null,  status: "pending",  reason: null, createdAt: "2026-10-02", resolvedAt: null },
  { id: "ap-3", type: "EFRIS",         objectRef: "Commission / Sep 2026 (CON-1001)", maker: "maiki", checker: null, status: "pending", reason: null, createdAt: "2026-10-02", resolvedAt: null },
  { id: "ap-4", type: "LOAN_ADJUSTMENT",objectRef: "loan-1 / write-down", maker: "maiki", checker: "aya", status: "approved", reason: null, createdAt: "2026-08-15", resolvedAt: "2026-08-15" },
  { id: "ap-5", type: "PAYOUT_CYCLE",  objectRef: "CON-1001 / Aug 2026", maker: "maiki", checker: "aya", status: "approved", reason: null, createdAt: "2026-09-02", resolvedAt: "2026-09-02" },
  { id: "ap-6", type: "EFRIS",         objectRef: "Commission / Aug 2026", maker: "maiki", checker: "aya", status: "approved", reason: null, createdAt: "2026-09-03", resolvedAt: "2026-09-03" },
];

// ── Payout requests (SAD §7.2) ────────────────────────────────────────────────
export const PAYOUT_REQUESTS: PayoutRequest[] = [
  { id: "pr-1", clientId: "c1", clientName: "Kiryandongo Water Ltd",   contractRef: "CON-1001", requestedAmount: 200_000, availableAmount: 800_000, period: "2026-09", status: "pending",     reason: "Mid-month operational expenses", createdAt: "2026-09-16", idempotencyKey: "PR-C1-202609-001" },
  { id: "pr-2", clientId: "c2", clientName: "Gomba Community Water",   contractRef: "CON-1002", requestedAmount: 50_000,  availableAmount: 221_000, period: "2026-09", status: "approved",    reason: "Urgent pump repair",            createdAt: "2026-09-20", idempotencyKey: "PR-C2-202609-001" },
  { id: "pr-3", clientId: "c3", clientName: "Butambala UNICEF Project", contractRef: "CON-1003", requestedAmount: 150_000, availableAmount: 505_500, period: "2026-08", status: "transferred", reason: null,                           createdAt: "2026-08-22", idempotencyKey: "PR-C3-202608-001" },
];

// ── EFRIS submissions ─────────────────────────────────────────────────────────
export const EFRIS_SUBMISSIONS: EfrisSubmission[] = [
  { id: "ef-1", recordType: "COMMISSION",     clientName: "Kiryandongo Water Ltd",    contractRef: "CON-1001", amount: 312_500, period: "2026-09", status: "ready",    efrisRef: null,             invoiceNumber: null,           attempts: 0, createdAt: "2026-10-02" },
  { id: "ef-2", recordType: "COMMISSION",     clientName: "Gomba Community Water",    contractRef: "CON-1002", amount: 52_800,  period: "2026-09", status: "ready",    efrisRef: null,             invoiceNumber: null,           attempts: 0, createdAt: "2026-10-02" },
  { id: "ef-3", recordType: "COMMISSION",     clientName: "Butambala UNICEF Project", contractRef: "CON-1003", amount: 104_300, period: "2026-09", status: "ready",    efrisRef: null,             invoiceNumber: null,           attempts: 0, createdAt: "2026-10-02" },
  { id: "ef-4", recordType: "COMMISSION",     clientName: "Kiryandongo Water Ltd",    contractRef: "CON-1001", amount: 228_000, period: "2026-08", status: "approved", efrisRef: "EFRIS-2026-0801",invoiceNumber: "INV-2026-0801", attempts: 1, createdAt: "2026-09-03" },
  { id: "ef-5", recordType: "LOAN_REPAYMENT", clientName: "Gomba Community Water",    contractRef: "CON-1002", amount: 100_000, period: "2026-08", status: "rejected", efrisRef: null,             invoiceNumber: null,           attempts: 2, createdAt: "2026-09-03" },
];

// ── Users ─────────────────────────────────────────────────────────────────────
export const USERS: User[] = [
  { id: "u1", username: "admin",   role: "ADMIN",      status: "ACTIVE", lastLogin: "2026-10-30T08:00:00Z" },
  { id: "u2", username: "maiki",   role: "ACCOUNTANT", status: "ACTIVE", lastLogin: "2026-10-30T08:30:00Z" },
  { id: "u3", username: "aya",     role: "APPROVER",   status: "ACTIVE", lastLogin: "2026-10-30T09:00:00Z" },
  { id: "u4", username: "viewer1", role: "VIEWER",     status: "ACTIVE", lastLogin: "2026-10-28T14:00:00Z" },
];

// ── Report formats (SAD §6.5) ─────────────────────────────────────────────────
export const REPORT_FORMATS: ReportFormat[] = [
  { id: "rf-1", name: "Water collection & maintenance", elements: ["COLLECTION","TRANSFER_CALC","MONTHLY_FEE_BALANCE","LOAN_CALC"], outputFormats: ["PDF","EXCEL"], assignedClients: ["c1","c3"] },
  { id: "rf-2", name: "Government",                     elements: ["COLLECTION","TRANSFER_CALC"],                                   outputFormats: ["PDF","EXCEL"], assignedClients: ["c2"] },
  { id: "rf-3", name: "Private water vendor",           elements: ["COLLECTION","TRANSFER_CALC","INITIAL_FEE_BALANCE","MONTHLY_FEE_BALANCE","LOAN_CALC"], outputFormats: ["PDF","EXCEL"], assignedClients: [] },
  { id: "rf-4", name: "ASP",                            elements: ["COLLECTION","TRANSFER_CALC","MONTHLY_FEE_BALANCE"],             outputFormats: ["PDF","EXCEL"], assignedClients: [] },
  { id: "rf-5", name: "Water vendor 3-month",           elements: ["COLLECTION","TRANSFER_CALC","MONTHLY_FEE_BALANCE","LOAN_CALC"], outputFormats: ["PDF","EXCEL"], assignedClients: ["c4"] },
];
