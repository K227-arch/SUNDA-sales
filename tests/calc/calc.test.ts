import { describe, it, expect } from "vitest";
import { calculate, type ContractTerms, type LoanState, type Balances } from "../../src/lib/calc/calc";

const noLoan: LoanState = { balance: 0, monthlyRepayAmount: 0 };
const zeroBal: Balances = { initialFeeBalance: 0, monthlyFeeBalance: 0 };

const base: ContractTerms = {
  commissionPct: 0,
  monthlyFeeFixed: 0,
  monthlyFeePct: 0,
  maintenanceFeeType: "PERCENTAGE",
  maintenanceFeeValue: 0,
  bankChargePerPayout: 0,
  initialFeeInstallment: 0,
  initialFeeDeductFromCollection: false,
  transferMethod: "MOBILE_MONEY",
};

describe("SAD §6.2 formula — illustrative example", () => {
  it("matches SAD example: collection 1,521,230; monthly 50k+10%; maintenance 5%; bank 5k; loan 300k; additional 400k", () => {
    const r = calculate({
      gross: 1_521_230,
      contract: {
        ...base,
        monthlyFeeFixed: 50_000,
        monthlyFeePct: 0.10,
        maintenanceFeeType: "PERCENTAGE",
        maintenanceFeeValue: 0.05,
        bankChargePerPayout: 5_000,
        transferMethod: "BANK",
      },
      loan: { balance: 5_000_000, monthlyRepayAmount: 300_000 },
      balances: zeroBal,
      additionalTransfer: 400_000,
    });
    // SAD states net ≈ 538,045
    expect(r.monthlyFee).toBe(50_000 + Math.round(0.10 * 1_521_230));
    expect(r.maintenanceFee).toBe(Math.round(0.05 * 1_521_230));
    expect(r.bankCharge).toBe(5_000);
    expect(r.loanRepay).toBe(300_000);
    expect(r.additionalTransfer).toBe(400_000);
    expect(r.net).toBe(
      1_521_230 - r.monthlyFee - r.maintenanceFee - 5_000 - 300_000 - 400_000
    );
  });
});

describe("commission breakdown", () => {
  it("commission = sum of all fee components", () => {
    const r = calculate({
      gross: 1_000_000,
      contract: { ...base, monthlyFeeFixed: 50_000, maintenanceFeeType: "FIXED_MONTHLY", maintenanceFeeValue: 20_000, bankChargePerPayout: 5_000, transferMethod: "BANK" },
      loan: noLoan, balances: zeroBal, additionalTransfer: 100_000,
    });
    expect(r.commission).toBe(
      r.commissionBreakdown.monthlyFee +
      r.commissionBreakdown.maintenanceFee +
      r.commissionBreakdown.bankCharge +
      r.commissionBreakdown.additionalTransferFee +
      r.commissionBreakdown.initialFee
    );
  });
});

describe("initial fee deducted from collection", () => {
  it("deducts when initialFeeDeductFromCollection=true", () => {
    const r = calculate({
      gross: 500_000,
      contract: { ...base, initialFeeInstallment: 30_000, initialFeeDeductFromCollection: true },
      loan: noLoan,
      balances: { initialFeeBalance: 100_000, monthlyFeeBalance: 0 },
    });
    expect(r.initialFee).toBe(30_000);
    expect(r.newInitialFeeBalance).toBe(70_000);
  });
  it("does NOT deduct when initialFeeDeductFromCollection=false", () => {
    const r = calculate({
      gross: 500_000,
      contract: { ...base, initialFeeInstallment: 30_000, initialFeeDeductFromCollection: false },
      loan: noLoan,
      balances: { initialFeeBalance: 100_000, monthlyFeeBalance: 0 },
    });
    expect(r.initialFee).toBe(0);
  });
});

describe("maintenance fee types", () => {
  it("PERCENTAGE — % of gross", () => {
    const r = calculate({ gross: 1_000_000, contract: { ...base, maintenanceFeeType: "PERCENTAGE", maintenanceFeeValue: 0.08 }, loan: noLoan, balances: zeroBal });
    expect(r.maintenanceFee).toBe(80_000);
  });
  it("FIXED_MONTHLY — flat amount", () => {
    const r = calculate({ gross: 1_000_000, contract: { ...base, maintenanceFeeType: "FIXED_MONTHLY", maintenanceFeeValue: 20_000 }, loan: noLoan, balances: zeroBal });
    expect(r.maintenanceFee).toBe(20_000);
  });
  it("PER_EVENT — count × value", () => {
    const r = calculate({ gross: 1_000_000, contract: { ...base, maintenanceFeeType: "PER_EVENT", maintenanceFeeValue: 50_000 }, loan: noLoan, balances: zeroBal, perEventMaintenanceCount: 3 });
    expect(r.maintenanceFee).toBe(150_000);
  });
});

describe("additional transfer (SAD §6.1)", () => {
  it("deducted from net; flagged in flags when results in near-zero", () => {
    const r = calculate({ gross: 500_000, contract: base, loan: noLoan, balances: zeroBal, additionalTransfer: 500_000 });
    expect(r.additionalTransfer).toBe(500_000);
    expect(r.net).toBe(0);
    expect(r.flags).toContain("zero_or_negative_payout");
  });
});

describe("loan cap and flag", () => {
  it("caps repayment at loan balance", () => {
    const r = calculate({ gross: 1_000_000, contract: base, loan: { balance: 100_000, monthlyRepayAmount: 300_000 }, balances: zeroBal });
    expect(r.loanRepay).toBe(100_000);
    expect(r.flags).toContain("loan_fully_repaid");
  });
});

describe("monthly fee carry-forward", () => {
  it("carries unpaid portion to newMonthlyFeeBalance", () => {
    const r = calculate({
      gross: 50_000,
      contract: { ...base, monthlyFeeFixed: 80_000 },
      loan: noLoan,
      balances: zeroBal,
    });
    expect(r.monthlyFeeCovered).toBe(false);
    expect(r.flags).toContain("monthly_fee_not_covered");
    expect(r.newMonthlyFeeBalance).toBeGreaterThan(0);
  });
});

describe("determinism", () => {
  it("same inputs always give same result", () => {
    const args = {
      gross: 2_500_000,
      contract: { ...base, monthlyFeeFixed: 60_000, monthlyFeePct: 0.05, maintenanceFeeType: "PERCENTAGE" as const, maintenanceFeeValue: 0.08, bankChargePerPayout: 5_000, transferMethod: "BANK" as const },
      loan: { balance: 3_000_000, monthlyRepayAmount: 250_000 },
      balances: { initialFeeBalance: 100_000, monthlyFeeBalance: 10_000 },
      additionalTransfer: 150_000,
    };
    expect(calculate(args)).toEqual(calculate(args));
  });
});
