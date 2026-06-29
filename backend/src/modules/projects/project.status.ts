import ApiError from "../../utils/ApiError";

export type ProjectStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "AWAITING_APPROVAL"
  | "SUBMITTED_FOR_REVIEW"
  | "REVISION_REQUESTED"
  | "COMPLETED"
  | "CANCELLED";

/** Statuses where the client can review submitted work. */
export const REVIEWABLE_STATUSES: ProjectStatus[] = [
  "SUBMITTED_FOR_REVIEW",
  "AWAITING_APPROVAL",
];

/** Statuses where the engineer may submit or resubmit work. */
export const SUBMITTABLE_STATUSES: ProjectStatus[] = [
  "IN_PROGRESS",
  "REVISION_REQUESTED",
];

const ALLOWED_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  OPEN: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["SUBMITTED_FOR_REVIEW", "CANCELLED"],
  AWAITING_APPROVAL: ["REVISION_REQUESTED", "COMPLETED"],
  SUBMITTED_FOR_REVIEW: ["REVISION_REQUESTED", "COMPLETED"],
  REVISION_REQUESTED: ["SUBMITTED_FOR_REVIEW", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function assertProjectTransition(
  from: ProjectStatus,
  to: ProjectStatus,
): void {
  if (from === to) return;
  const allowed = ALLOWED_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new ApiError(
      400,
      `Invalid project status transition from ${from} to ${to}`,
    );
  }
}

export function isReviewableStatus(status: string): boolean {
  return REVIEWABLE_STATUSES.includes(status as ProjectStatus);
}

export function isSubmittableStatus(status: string): boolean {
  return SUBMITTABLE_STATUSES.includes(status as ProjectStatus);
}
