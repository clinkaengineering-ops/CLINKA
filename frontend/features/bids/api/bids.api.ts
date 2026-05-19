import api from "@/lib/axios";
import type { ApiResponse } from "@/features/engineers/api/engineer.api";

const unwrap = <T>(promise: Promise<{ data: ApiResponse<T> }>) =>
  promise.then((r) => r.data.data);

export interface CreateBidPayload {
  price: number;
  duration: string;
  description: string;
}

/** POST /projects/:projectId/bids */
export const createBid = (projectId: number, payload: CreateBidPayload) =>
  unwrap(api.post<ApiResponse<unknown>>(`/projects/${projectId}/bids`, payload));

/** PUT /projects/approve/:bidId — client accepts a bid */
export const approveBid = (bidId: number) =>
  unwrap(api.put<ApiResponse<{ message: string }>>(`/projects/approve/${bidId}`));
