import ApiError from "../../utils/ApiError";
import {
  assertCanEditContent,
  assertCanToggleStatus,
  computePermissions,
  CONTENT_FIELDS,
} from "./project.editlock";

describe("computePermissions", () => {
  it("returns FULL when there are no bids and project is OPEN", () => {
    const p = computePermissions(0, false, "OPEN");
    expect(p.editTier).toBe("FULL");
    expect(p.canEditContent).toBe(true);
    expect(p.canToggleStatus).toBe(true);
    expect(p.lockReason).toBeNull();
  });

  it("returns STATUS_ONLY when bids exist but none accepted", () => {
    const p = computePermissions(3, false, "OPEN");
    expect(p.editTier).toBe("STATUS_ONLY");
    expect(p.canEditContent).toBe(false);
    expect(p.canToggleStatus).toBe(true);
    expect(p.lockReason).not.toBeNull();
  });

  it("returns STATUS_ONLY when bids exist and project is CLOSED", () => {
    const p = computePermissions(2, false, "CLOSED");
    expect(p.editTier).toBe("STATUS_ONLY");
    expect(p.canEditContent).toBe(false);
    expect(p.canToggleStatus).toBe(true);
  });

  it("returns LOCKED when a bid has been accepted", () => {
    const p = computePermissions(1, true, "OPEN");
    expect(p.editTier).toBe("LOCKED");
    expect(p.canEditContent).toBe(false);
    expect(p.canToggleStatus).toBe(false);
    expect(p.lockReason).not.toBeNull();
  });

  it("returns LOCKED when project status is IN_PROGRESS regardless of bids", () => {
    const p = computePermissions(0, false, "IN_PROGRESS");
    expect(p.editTier).toBe("LOCKED");
    expect(p.canEditContent).toBe(false);
    expect(p.canToggleStatus).toBe(false);
  });

  it("returns LOCKED when project status is COMPLETED", () => {
    const p = computePermissions(0, false, "COMPLETED");
    expect(p.editTier).toBe("LOCKED");
  });

  it("returns LOCKED when project status is CANCELLED", () => {
    const p = computePermissions(0, false, "CANCELLED");
    expect(p.editTier).toBe("LOCKED");
  });

  it("returns LOCKED when project status is AWAITING_PAYMENT", () => {
    const p = computePermissions(0, false, "AWAITING_PAYMENT");
    expect(p.editTier).toBe("LOCKED");
  });

  it("returns LOCKED for SUBMITTED_FOR_REVIEW", () => {
    const p = computePermissions(1, true, "SUBMITTED_FOR_REVIEW");
    expect(p.editTier).toBe("LOCKED");
  });

  it("returns LOCKED for REVISION_REQUESTED", () => {
    const p = computePermissions(1, true, "REVISION_REQUESTED");
    expect(p.editTier).toBe("LOCKED");
  });
});

describe("assertCanEditContent", () => {
  it("passes for FULL tier", () => {
    const p = computePermissions(0, false, "OPEN");
    expect(() => assertCanEditContent(p)).not.toThrow();
  });

  it("throws ApiError 409 for STATUS_ONLY tier", () => {
    const p = computePermissions(3, false, "OPEN");
    expect(() => assertCanEditContent(p)).toThrow(
      expect.objectContaining({ statusCode: 409 }),
    );
  });

  it("throws ApiError 409 for LOCKED tier", () => {
    const p = computePermissions(1, true, "IN_PROGRESS");
    expect(() => assertCanEditContent(p)).toThrow(
      expect.objectContaining({ statusCode: 409 }),
    );
  });
});

describe("assertCanToggleStatus", () => {
  it("passes for FULL tier", () => {
    const p = computePermissions(0, false, "OPEN");
    expect(() => assertCanToggleStatus(p)).not.toThrow();
  });

  it("passes for STATUS_ONLY tier", () => {
    const p = computePermissions(5, false, "OPEN");
    expect(() => assertCanToggleStatus(p)).not.toThrow();
  });

  it("throws ApiError 423 for LOCKED tier", () => {
    const p = computePermissions(1, true, "IN_PROGRESS");
    expect(() => assertCanToggleStatus(p)).toThrow(
      expect.objectContaining({ statusCode: 423 }),
    );
  });
});

describe("CONTENT_FIELDS", () => {
  it("includes all bid-affecting fields", () => {
    expect(CONTENT_FIELDS.includes("title")).toBeTruthy();
    expect(CONTENT_FIELDS.includes("description")).toBeTruthy();
    expect(CONTENT_FIELDS.includes("budget")).toBeTruthy();
    expect(CONTENT_FIELDS.includes("serviceType")).toBeTruthy();
  });

  it("has exactly 4 entries (update this test when new fields are added)", () => {
    expect(CONTENT_FIELDS.length).toBe(4);
  });
});

describe("optimistic concurrency", () => {
  it("permissions computed from fresh input reject edits after state changes", () => {
    const before = computePermissions(0, false, "OPEN");
    expect(before.canEditContent).toBe(true);

    const after = computePermissions(1, false, "OPEN");
    expect(after.canEditContent).toBe(false);

    expect(() => assertCanEditContent(after)).toThrow(
      expect.objectContaining({ statusCode: 409 }),
    );
  });
});
