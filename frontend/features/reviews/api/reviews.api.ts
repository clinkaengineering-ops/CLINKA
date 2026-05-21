import api from "@/lib/axios";
import type { ApiResponse } from "@/features/engineers/api/engineer.api";
import type {
  CreateReviewPayload,
  PendingReviewProject,
  Review,
  ReviewEligibility,
} from "../types";

const unwrap = <T>(promise: Promise<{ data: ApiResponse<T> }>) =>
  promise.then((r) => r.data.data);

/** GET /reviews/pending */
export const fetchPendingReviews = (): Promise<PendingReviewProject[]> =>
  unwrap(api.get<ApiResponse<PendingReviewProject[]>>("/reviews/pending")).then(
    (d) => d ?? [],
  );

/** GET /reviews/mine */
export const fetchMyReviews = (): Promise<Review[]> =>
  unwrap(api.get<ApiResponse<Review[]>>("/reviews/mine")).then((d) => d ?? []);

/** GET /reviews/engineers/:engineerId */
export const fetchEngineerReviews = (engineerId: number): Promise<Review[]> =>
  unwrap(
    api.get<ApiResponse<Review[]>>(`/reviews/engineers/${engineerId}`),
  ).then((d) => d ?? []);

/** GET /reviews/projects/:projectId */
export const fetchProjectReview = (projectId: number): Promise<Review> =>
  unwrap(api.get<ApiResponse<Review>>(`/reviews/projects/${projectId}`)).then(
    (d) => {
      if (!d) throw new Error("Review not found");
      return d;
    },
  );

/** GET /reviews/projects/:projectId/eligibility */
export const fetchReviewEligibility = (
  projectId: number,
): Promise<ReviewEligibility> =>
  unwrap(
    api.get<ApiResponse<ReviewEligibility>>(
      `/reviews/projects/${projectId}/eligibility`,
    ),
  ).then((d) => {
    if (!d) throw new Error("Failed to check review eligibility");
    return d;
  });

/** POST /reviews/projects/:projectId */
export const submitProjectReview = (
  projectId: number,
  payload: CreateReviewPayload,
): Promise<Review> =>
  unwrap(
    api.post<ApiResponse<Review>>(`/reviews/projects/${projectId}`, payload),
  ).then((d) => {
    if (!d) throw new Error("Failed to submit review");
    return d;
  });
