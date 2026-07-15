import ApiError from "../../utils/ApiError";

export type EditTier = "FULL" | "STATUS_ONLY" | "LOCKED";

export interface ProjectPermissions {
  canEditContent: boolean;
  canToggleStatus: boolean;
  editTier: EditTier;
  lockReason: string | null;
}

/**
 * Computes the edit permissions for a project based on its current state.
 *
 * - FULL:        No bids exist → all fields editable
 * - STATUS_ONLY: Bids exist but none accepted → only OPEN↔CLOSED toggle
 * - LOCKED:      Bid accepted or status beyond OPEN/CLOSED → read-only
 */
export function computePermissions(
  bidCount: number,
  hasAcceptedBid: boolean,
  projectStatus: string,
): ProjectPermissions {
  // If a bid has been accepted, or the project has progressed beyond OPEN/CLOSED,
  // it's fully locked — only backend business logic controls status from here.
  if (
    hasAcceptedBid ||
    (projectStatus !== "OPEN" && projectStatus !== "CLOSED")
  ) {
    return {
      canEditContent: false,
      canToggleStatus: false,
      editTier: "LOCKED",
      lockReason:
        "This project is in progress. All changes are managed automatically.",
    };
  }

  // If there are bids but none accepted, content is locked to protect fairness.
  // The client can only toggle availability (OPEN ↔ CLOSED).
  if (bidCount > 0) {
    return {
      canEditContent: false,
      canToggleStatus: true,
      editTier: "STATUS_ONLY",
      lockReason:
        "This project has bids. Content is locked to protect bidder fairness.",
    };
  }

  // No bids — full edit access.
  return {
    canEditContent: true,
    canToggleStatus: true,
    editTier: "FULL",
    lockReason: null,
  };
}

/**
 * Content fields that affect bidding decisions.
 * Uses an allowlist approach: any field NOT in the allowed set is blocked.
 */
export const CONTENT_FIELDS = [
  "title",
  "description",
  "budget",
  "serviceType",
] as const;

/**
 * Asserts that the caller is allowed to edit content fields.
 * Throws 409 Conflict if content is locked.
 */
export function assertCanEditContent(permissions: ProjectPermissions): void {
  if (!permissions.canEditContent) {
    throw new ApiError(
      409,
      permissions.lockReason ??
        "Project content is locked after bids have been received.",
    );
  }
}

/**
 * Asserts that the caller is allowed to toggle the project status.
 * Throws 423 Locked if the project is fully locked.
 */
export function assertCanToggleStatus(permissions: ProjectPermissions): void {
  if (!permissions.canToggleStatus) {
    throw new ApiError(
      423,
      permissions.lockReason ??
        "This project is fully locked and cannot be modified.",
    );
  }
}
