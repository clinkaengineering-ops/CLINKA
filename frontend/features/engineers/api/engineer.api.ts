// lib/api/user.api.ts
// All user-related API calls in one place.
// Types come from @/types — nothing is re-declared here.
import api from "@/lib/axios";
import type { Me, Engineer, EngineerProfile, PortfolioItem } from "@/types";

// ── Generic ApiResponse wrapper (matches your backend util) ──────────────────
export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

// ── Unwrap helper — keeps call sites clean ───────────────────────────────────
const unwrap = <T>(promise: Promise<{ data: ApiResponse<T> }>) =>
  promise.then((r) => r.data.data);

// ── Me ────────────────────────────────────────────────────────────────────────

/** GET /users/me — returns the logged-in user with profile */
export const getMe = (): Promise<Me> =>
  unwrap(api.get<ApiResponse<Me>>("/users/me"));

/**
 * PUT /users/me — update name and/or bio.
 * Backend must include { include: { profile: true } } in its Prisma update
 * so the response always returns the full Me shape with profile attached.
 */
export const updateMe = (payload: { name?: string; bio?: string }): Promise<Me> =>
  unwrap(api.put<ApiResponse<Me>>("/users/me", payload));

// ── Engineers ─────────────────────────────────────────────────────────────────

/** GET /users/engineers — list of APPROVED engineers */
export const getEngineers = (): Promise<Engineer[]> =>
  unwrap(api.get<ApiResponse<Engineer[]>>("/users/engineers"));

/** GET /users/engineers/:id */
export const getEngineerById = (id: number): Promise<Engineer> =>
  unwrap(api.get<ApiResponse<Engineer>>(`/users/engineers/${id}`));

// ── Portfolio ─────────────────────────────────────────────────────────────────

/** POST /users/portfolio */
export const addPortfolioItem = (data: {
  imageUrl: string;
  description: string;
}): Promise<PortfolioItem> =>
  unwrap(api.post<ApiResponse<PortfolioItem>>("/users/portfolio", data));

/** DELETE /users/portfolio/:id */
export const deletePortfolioItem = (id: number): Promise<void> =>
  unwrap(api.delete<ApiResponse<void>>(`/users/portfolio/${id}`));
