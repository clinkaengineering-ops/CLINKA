"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUBMITTABLE_STATUSES = exports.REVIEWABLE_STATUSES = void 0;
exports.assertProjectTransition = assertProjectTransition;
exports.isReviewableStatus = isReviewableStatus;
exports.isSubmittableStatus = isSubmittableStatus;
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
/** Statuses where the client can review submitted work. */
exports.REVIEWABLE_STATUSES = [
    "SUBMITTED_FOR_REVIEW",
    "AWAITING_APPROVAL",
];
/** Statuses where the engineer may submit or resubmit work. */
exports.SUBMITTABLE_STATUSES = [
    "IN_PROGRESS",
    "REVISION_REQUESTED",
];
const ALLOWED_TRANSITIONS = {
    OPEN: ["IN_PROGRESS", "CANCELLED"],
    IN_PROGRESS: ["SUBMITTED_FOR_REVIEW", "CANCELLED"],
    AWAITING_APPROVAL: ["REVISION_REQUESTED", "COMPLETED"],
    SUBMITTED_FOR_REVIEW: ["REVISION_REQUESTED", "COMPLETED"],
    REVISION_REQUESTED: ["SUBMITTED_FOR_REVIEW", "CANCELLED"],
    COMPLETED: [],
    CANCELLED: [],
};
function assertProjectTransition(from, to) {
    if (from === to)
        return;
    const allowed = ALLOWED_TRANSITIONS[from] ?? [];
    if (!allowed.includes(to)) {
        throw new ApiError_1.default(400, `Invalid project status transition from ${from} to ${to}`);
    }
}
function isReviewableStatus(status) {
    return exports.REVIEWABLE_STATUSES.includes(status);
}
function isSubmittableStatus(status) {
    return exports.SUBMITTABLE_STATUSES.includes(status);
}
