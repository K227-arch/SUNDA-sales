/**
 * SUNDA Payout calculation engine — pure TypeScript, deterministic.
 * SAD §6.2 formula (3 Nov 2026 revision):
 *
 *   Net =  Collection
 *        − Initial payment deduction   (if deducted from collection)
 *        − Monthly fee                 (fixed + % × Collection)
 *        − Maintenance fee             (% | fixed monthly | per event)
 *        − Bank transfer charge        (bank payouts only)
 *        − Unit-loan repayment         (sum of active loans)
 *        − Shortage from previous month
 *        − Additional transfers already paid this month
 *        ± Other manual lines
 *
 * Commission (= Sunda sales registered on EFRIS) = sum of:
 *   initial_fee + monthly_fee + additional_transfer_fee + maintenance_fee + bank_charge
 *
 * All money is integer UGX (no minor unit).
 */

export type TransferMethod = "MOBILE_MONEY" | "BANK";
export type MaintenanceFeeType = "PERCENTAGE" | "FIXED_MONTHLY" | "PER_EVENT";

export interface ContractTerms {
  commissionPct: number;          // NOT used as a single %; kept for backwards compat
  monthlyFeeFixed: number;        // UGX subscription
  monthlyFeePct: number;          // fraction of gross
  maintenanceFeeType: MaintenanceFeeType;
  maintenanceFeeValue: number;    // pct if PERCENTAGE, UGX if FIXED/PER_EVENT
  bankChargePerPayout: number;    // UGX (bank only)
  initialFeeInstallment: number;  // UGX per cycle
  initialFeeDeductFromCollection: boolean;
  transferMethod: TransferMethod;
}

export interface LoanState {
  balance: number;
  monthlyRepayAmount: number;
}

export interface Balances {
  initialFeeBalance: number;   // remaining initial fee
  monthlyFeeBalance: number;   // carried shortage from prior cycle (≥ 0)
}

export interface CalcInputs {
  gross: number;              // reconciled collection this cycle
  contract: ContractTerms;
  loan: LoanState;
  balances: Balances;
  additionalTransfer?: number; // mid-month advances already paid (SAD §6.1)
  perEventMaintenanceCount?: number; // for PER_EVENT type
  otherPayments?: number;
}

export interface CalcResult {
  gross: number;
  initialFee: number;
  monthlyFee: number;
  monthlyFeeCovered: boolean;
  maintenanceFee: number;
  bankCharge: number;
  loanRepay: number;
  additionalTransfer: number;
  shortage: number;           // shortage applied this cycle (from balances.monthlyFeeBalance)
  other: number;
  net: number;
  // Commission = all Sunda fees (= EFRIS sales)
  commission: number;
  commissionBreakdown: {
    initialFee: number;
    monthlyFee: number;
    maintenanceFee: number;
    bankCharge: number;
    additionalTransferFee: number; // fee on the additional transfer (same as additionalTransfer amount for now)
  };
  newLoanBalance: number;
  newInitialFeeBalance: number;
  newMonthlyFeeBalance: number;
  flags: string[];
}

const clamp = (n: number, max: number) => Math.max(0, Math.min(n, max));

export function calculate(input: CalcInputs): CalcResult {
  const { gross, contract, loan, balances } = input;
  const additionalTransfer = input.additionalTransfer ?? 0;
  const other = input.otherPayments ?? 0;
  const flags: string[] = [];

  if (gross <= 0) flags.push("no_collection");

  // 1) Initial fee instalment (deducted from collection only if contracted)
  let initialFee = 0;
  let newInitialFeeBalance = balances.initialFeeBalance;
  if (contract.initialFeeDeductFromCollection && balances.initialFeeBalance > 0) {
    initialFee = Math.min(contract.initialFeeInstallment, balances.initialFeeBalance);
    newInitialFeeBalance = balances.initialFeeBalance - initialFee;
  }

  // 2) Monthly fee (fixed subscription + % of gross) + carry forward
  const monthlyFeeDue = Math.round(contract.monthlyFeeFixed + contract.monthlyFeePct * gross);
  const monthlyObligation = monthlyFeeDue + Math.max(balances.monthlyFeeBalance, 0);
  const availableForMonthly = Math.max(gross - initialFee, 0);
  const monthlyFee = clamp(monthlyObligation, availableForMonthly);
  const monthlyFeeCovered = monthlyFee >= monthlyObligation;
  const newMonthlyFeeBalance = Math.max(monthlyObligation - monthlyFee, 0);
  if (!monthlyFeeCovered) flags.push("monthly_fee_not_covered");

  // 3) Maintenance fee
  let maintenanceFee = 0;
  if (contract.maintenanceFeeType === "PERCENTAGE") {
    maintenanceFee = Math.round(contract.maintenanceFeeValue * gross);
  } else if (contract.maintenanceFeeType === "FIXED_MONTHLY") {
    maintenanceFee = contract.maintenanceFeeValue;
  } else {
    // PER_EVENT — caller passes count
    maintenanceFee = contract.maintenanceFeeValue * (input.perEventMaintenanceCount ?? 0);
  }

  // 4) Bank charge
  const bankCharge = contract.transferMethod === "BANK" ? contract.bankChargePerPayout : 0;

  // 5) Loan repayment — capped at available after commission fees
  const feesTotal = initialFee + monthlyFee + maintenanceFee + bankCharge;
  const availableForLoan = Math.max(gross - feesTotal, 0);
  const loanRepay = clamp(
    Math.min(loan.monthlyRepayAmount, loan.balance),
    availableForLoan,
  );
  const newLoanBalance = loan.balance - loanRepay;
  if (newLoanBalance <= 0 && loan.balance > 0) flags.push("loan_fully_repaid");

  // 6) Shortage from previous month (already counted in monthlyFee calc above)
  const shortage = Math.max(balances.monthlyFeeBalance, 0);

  // 7) Net
  const net =
    gross
    - initialFee
    - monthlyFee
    - maintenanceFee
    - bankCharge
    - loanRepay
    - additionalTransfer
    - other;

  if (net <= 0) flags.push("zero_or_negative_payout");

  // Commission = all fee components (EFRIS sales)
  const additionalTransferFee = additionalTransfer; // the fee IS the advance amount
  const commission = initialFee + monthlyFee + maintenanceFee + bankCharge + additionalTransferFee;

  return {
    gross,
    initialFee,
    monthlyFee,
    monthlyFeeCovered,
    maintenanceFee,
    bankCharge,
    loanRepay,
    additionalTransfer,
    shortage,
    other,
    net,
    commission,
    commissionBreakdown: {
      initialFee,
      monthlyFee,
      maintenanceFee,
      bankCharge,
      additionalTransferFee,
    },
    newLoanBalance,
    newInitialFeeBalance,
    newMonthlyFeeBalance,
    flags,
  };
}
