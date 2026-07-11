import assert from "node:assert/strict";
import { describe, it } from "node:test";
import ApiError from "../../utils/ApiError";
import {
  assertPayoutTransition,
  canTransitionPayoutStatus,
  mapPaymobStatusToWithdrawalStatus,
  normalizePaymobDisbursementStatus,
} from "./payout.state";

describe("normalizePaymobDisbursementStatus", () => {
  it("maps success variants", () => {
    assert.equal(normalizePaymobDisbursementStatus("success"), "success");
    assert.equal(normalizePaymobDisbursementStatus("Successful"), "success");
  });

  it("maps pending", () => {
    assert.equal(normalizePaymobDisbursementStatus("pending"), "pending");
  });

  it("maps everything else to failed", () => {
    assert.equal(normalizePaymobDisbursementStatus("failed"), "failed");
    assert.equal(normalizePaymobDisbursementStatus("rejected"), "failed");
  });
});

describe("mapPaymobStatusToWithdrawalStatus", () => {
  it("maps Paymob statuses to internal withdrawal statuses", () => {
    assert.equal(mapPaymobStatusToWithdrawalStatus("success"), "COMPLETED");
    assert.equal(mapPaymobStatusToWithdrawalStatus("pending"), "PROCESSING");
    assert.equal(mapPaymobStatusToWithdrawalStatus("failed"), "FAILED");
  });
});

describe("payout status transitions", () => {
  it("allows PENDING → SUBMITTED", () => {
    assert.equal(canTransitionPayoutStatus("PENDING", "SUBMITTED"), true);
  });

  it("allows PROCESSING → COMPLETED", () => {
    assert.equal(canTransitionPayoutStatus("PROCESSING", "COMPLETED"), true);
  });

  it("blocks COMPLETED → PENDING", () => {
    assert.equal(canTransitionPayoutStatus("COMPLETED", "PENDING"), false);
  });

  it("allows manual review resolution paths", () => {
    assert.equal(
      canTransitionPayoutStatus("FAILED_NEEDS_MANUAL_REVIEW", "CANCELLED"),
      true,
    );
    assert.equal(
      canTransitionPayoutStatus("FAILED_NEEDS_MANUAL_REVIEW", "COMPLETED"),
      true,
    );
  });

  it("throws on invalid transitions", () => {
    assert.throws(
      () => assertPayoutTransition("COMPLETED", "FAILED"),
      (err: unknown) =>
        err instanceof ApiError &&
        /Invalid payout status transition/.test(err.message),
    );
  });
});
