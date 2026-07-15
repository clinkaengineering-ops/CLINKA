import assert from "node:assert/strict";
import { describe, it } from "node:test";
import ApiError from "../../utils/ApiError";
import {
  assertCanEditContent,
  assertCanToggleStatus,
  computePermissions,
  CONTENT_FIELDS,
} from "./project.editlock";

// ---------------------------------------------------------------------------
// computePermissions
// ---------------------------------------------------------------------------

describe("computePermissions", () => {
  it("returns FULL when there are no bids and project is OPEN", () => {
    const p = computePermissions(0, false, "OPEN");
    assert.equal(p.editTier, "FULL");
    assert.equal(p.canEditContent, true);
    assert.equal(p.canToggleStatus, true);
    assert.equal(p.lockReason, null);
  });

  it("returns STATUS_ONLY when bids exist but none accepted", () => {
    const p = computePermissions(3, false, "OPEN");
    assert.equal(p.editTier, "STATUS_ONLY");
    assert.equal(p.canEditContent, false);
    assert.equal(p.canToggleStatus, true);
    assert.notEqual(p.lockReason, null);
  });

  it("returns STATUS_ONLY when bids exist and project is CLOSED", () => {
    const p = computePermissions(2, false, "CLOSED");
    assert.equal(p.editTier, "STATUS_ONLY");
    assert.equal(p.canEditContent, false);
    assert.equal(p.canToggleStatus, true);
  });

  it("returns LOCKED when a bid has been accepted", () => {
    const p = computePermissions(1, true, "OPEN");
    assert.equal(p.editTier, "LOCKED");
    assert.equal(p.canEditContent, false);
    assert.equal(p.canToggleStatus, false);
    assert.notEqual(p.lockReason, null);
  });

  it("returns LOCKED when project status is IN_PROGRESS regardless of bids", () => {
    const p = computePermissions(0, false, "IN_PROGRESS");
    assert.equal(p.editTier, "LOCKED");
    assert.equal(p.canEditContent, false);
    assert.equal(p.canToggleStatus, false);
  });

  it("returns LOCKED when project status is COMPLETED", () => {
    const p = computePermissions(0, false, "COMPLETED");
    assert.equal(p.editTier, "LOCKED");
  });

  it("returns LOCKED when project status is CANCELLED", () => {
    const p = computePermissions(0, false, "CANCELLED");
    assert.equal(p.editTier, "LOCKED");
  });

  it("returns LOCKED when project status is AWAITING_PAYMENT", () => {
    const p = computePermissions(0, false, "AWAITING_PAYMENT");
    assert.equal(p.editTier, "LOCKED");
  });

  it("returns LOCKED for SUBMITTED_FOR_REVIEW", () => {
    const p = computePermissions(1, true, "SUBMITTED_FOR_REVIEW");
    assert.equal(p.editTier, "LOCKED");
  });

  it("returns LOCKED for REVISION_REQUESTED", () => {
    const p = computePermissions(1, true, "REVISION_REQUESTED");
    assert.equal(p.editTier, "LOCKED");
  });
});

// ---------------------------------------------------------------------------
// assertCanEditContent
// ---------------------------------------------------------------------------

describe("assertCanEditContent", () => {
  it("passes for FULL tier", () => {
    const p = computePermissions(0, false, "OPEN");
    assert.doesNotThrow(() => assertCanEditContent(p));
  });

  it("throws ApiError 409 for STATUS_ONLY tier", () => {
    const p = computePermissions(3, false, "OPEN");
    assert.throws(
      () => assertCanEditContent(p),
      (err: unknown) =>
        err instanceof ApiError && err.statusCode === 409,
    );
  });

  it("throws ApiError 409 for LOCKED tier", () => {
    const p = computePermissions(1, true, "IN_PROGRESS");
    assert.throws(
      () => assertCanEditContent(p),
      (err: unknown) =>
        err instanceof ApiError && err.statusCode === 409,
    );
  });
});

// ---------------------------------------------------------------------------
// assertCanToggleStatus
// ---------------------------------------------------------------------------

describe("assertCanToggleStatus", () => {
  it("passes for FULL tier", () => {
    const p = computePermissions(0, false, "OPEN");
    assert.doesNotThrow(() => assertCanToggleStatus(p));
  });

  it("passes for STATUS_ONLY tier", () => {
    const p = computePermissions(5, false, "OPEN");
    assert.doesNotThrow(() => assertCanToggleStatus(p));
  });

  it("throws ApiError 423 for LOCKED tier", () => {
    const p = computePermissions(1, true, "IN_PROGRESS");
    assert.throws(
      () => assertCanToggleStatus(p),
      (err: unknown) =>
        err instanceof ApiError && err.statusCode === 423,
    );
  });
});

// ---------------------------------------------------------------------------
// CONTENT_FIELDS
// ---------------------------------------------------------------------------

describe("CONTENT_FIELDS", () => {
  it("includes all bid-affecting fields", () => {
    assert.ok(CONTENT_FIELDS.includes("title"));
    assert.ok(CONTENT_FIELDS.includes("description"));
    assert.ok(CONTENT_FIELDS.includes("budget"));
    assert.ok(CONTENT_FIELDS.includes("serviceType"));
  });

  it("has exactly 4 entries (update this test when new fields are added)", () => {
    assert.equal(CONTENT_FIELDS.length, 4);
  });
});

// ---------------------------------------------------------------------------
// Optimistic concurrency scenario
// ---------------------------------------------------------------------------

describe("optimistic concurrency", () => {
  it("permissions computed from fresh input reject edits after state changes", () => {
    // Simulate: client loaded page when 0 bids existed
    const before = computePermissions(0, false, "OPEN");
    assert.equal(before.canEditContent, true);

    // Simulate: by the time client saves, a bid has arrived
    const after = computePermissions(1, false, "OPEN");
    assert.equal(after.canEditContent, false);

    // The backend would use `after` (fresh DB state), rejecting the edit
    assert.throws(
      () => assertCanEditContent(after),
      (err: unknown) => err instanceof ApiError && err.statusCode === 409,
    );
  });
});
