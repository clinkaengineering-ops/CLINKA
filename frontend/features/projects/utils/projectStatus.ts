export type ProjectStatus =
  | "OPEN"
  | "AWAITING_PAYMENT"
  | "IN_PROGRESS"
  | "AWAITING_APPROVAL"
  | "SUBMITTED_FOR_REVIEW"
  | "REVISION_REQUESTED"
  | "COMPLETED"
  | "CANCELLED";

export const REVIEWABLE_STATUSES: ProjectStatus[] = [
  "SUBMITTED_FOR_REVIEW",
  "AWAITING_APPROVAL",
];

export const SUBMITTABLE_STATUSES: ProjectStatus[] = [
  "IN_PROGRESS",
  "REVISION_REQUESTED",
];

export function isReviewableStatus(status: string): boolean {
  return REVIEWABLE_STATUSES.includes(status as ProjectStatus);
}

export function isSubmittableStatus(status: string): boolean {
  return SUBMITTABLE_STATUSES.includes(status as ProjectStatus);
}

export const STATUS_COLORS: Record<string, "green" | "amber" | "blue" | "slate" | "violet"> = {
  OPEN: "blue",
  AWAITING_PAYMENT: "amber",
  IN_PROGRESS: "amber",
  AWAITING_APPROVAL: "amber",
  SUBMITTED_FOR_REVIEW: "amber",
  REVISION_REQUESTED: "violet",
  COMPLETED: "green",
  CANCELLED: "slate",
};

export const STATUS_LABEL_KEYS: Record<string, string> = {
  OPEN: "proj.status.open",
  AWAITING_PAYMENT: "proj.status.awaitingPayment",
  IN_PROGRESS: "proj.status.inProgress",
  AWAITING_APPROVAL: "proj.status.submitted",
  SUBMITTED_FOR_REVIEW: "proj.status.submitted",
  REVISION_REQUESTED: "proj.status.revision",
  COMPLETED: "proj.status.completed",
  CANCELLED: "proj.status.cancelled",
};
