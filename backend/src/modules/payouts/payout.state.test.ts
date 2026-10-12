import ApiError from "../../utils/ApiError";
import {
  assertPayoutTransition,
  canTransitionPayoutStatus,
  mapPaymobStatusToWithdrawalStatus,
  normalizePaymobDisbursementStatus,
} from "./payout.state";

describe("normalizePaymobDisbursementStatus", () => {
  it("maps success variants", () => {
    expect(normalizePaymobDisbursementStatus("success")).toBe("success");
    expect(normalizePaymobDisbursementStatus("Successful")).toBe("success");
  });

  it("maps pending", () => {
    expect(normalizePaymobDisbursementStatus("pending")).toBe("pending");
  });

  it("maps everything else to failed", () => {
    expect(normalizePaymobDisbursementStatus("failed")).toBe("failed");
    expect(normalizePaymobDisbursementStatus("rejected")).toBe("failed");
  });
});

describe("mapPaymobStatusToWithdrawalStatus", () => {
  it("maps Paymob statuses to internal withdrawal statuses", () => {
    expect(mapPaymobStatusToWithdrawalStatus("success")).toBe("COMPLETED");
    expect(mapPaymobStatusToWithdrawalStatus("pending")).toBe("PROCESSING");
    expect(mapPaymobStatusToWithdrawalStatus("failed")).toBe("FAILED");
  });
});

describe("payout status transitions", () => {
  it("allows PENDING → SUBMITTED", () => {
    expect(canTransitionPayoutStatus("PENDING" as any, "SUBMITTED" as any)).toBe(true);
  });

  it("allows PROCESSING → COMPLETED", () => {
    expect(canTransitionPayoutStatus("PROCESSING" as any, "COMPLETED" as any)).toBe(true);
  });

  it("blocks COMPLETED → PENDING", () => {
    expect(canTransitionPayoutStatus("COMPLETED" as any, "PENDING" as any)).toBe(false);
  });

  it("allows manual review resolution paths", () => {
    expect(
      canTransitionPayoutStatus("FAILED_NEEDS_MANUAL_REVIEW" as any, "CANCELLED" as any),
    ).toBe(true);
    expect(
      canTransitionPayoutStatus("FAILED_NEEDS_MANUAL_REVIEW" as any, "COMPLETED" as any),
    ).toBe(true);
  });

  it("throws on invalid transitions", () => {
    expect(() => assertPayoutTransition("COMPLETED" as any, "FAILED" as any)).toThrow(
      /Invalid payout status transition/,
    );
  });
});
