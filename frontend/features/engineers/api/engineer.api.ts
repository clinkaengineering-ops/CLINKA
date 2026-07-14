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
export const updateMe = (payload: {
  name?: string;
  bio?: string;
  coverImageUrl?: string | null;
  nationality?: string | null;
  professionalHeadline?: string | null;
  availabilityStatus?: string;
  hourlyRateUSD?: number | null;
  startingProjectBudgetUSD?: number | null;
  yearsOfExperience?: number | null;
  skillIds?: number[];
  languageIds?: number[];
}): Promise<Me> => unwrap(api.put<ApiResponse<Me>>("/users/me", payload));

export const uploadAvatar = (file: File): Promise<Me> => {
  const form = new FormData();
  form.append("image", file);
  return unwrap(
    api.post<ApiResponse<Me>>("/users/me/avatar", form, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  );
};

export const uploadCoverImage = (file: File): Promise<Me> => {
  const form = new FormData();
  form.append("image", file);
  return unwrap(
    api.post<ApiResponse<Me>>("/users/me/cover", form, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  );
};

// ── Engineers ─────────────────────────────────────────────────────────────────

/** GET /users/engineers — list of APPROVED engineers */
export const getEngineers = (params?: {
  q?: string;
  specialty?: string;
  nationality?: string;
  disciplineId?: number;
  skillIds?: number[];
  serviceAreaId?: number;
  hourlyRateMax?: number;
  availabilityStatus?: string;
  sortBy?: string;
  page?: number;
}): Promise<Engineer[]> =>
  unwrap(api.get<ApiResponse<{engineers: Engineer[]}>>("/users/engineers", { params })).then(d => d.engineers);

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

/** POST /users/portfolio — multipart image upload */
export const uploadPortfolioItem = (
  file: File,
  description: string,
): Promise<PortfolioItem> => {
  const form = new FormData();
  form.append("image", file);
  form.append("description", description);
  return unwrap(
    api.post<ApiResponse<PortfolioItem>>("/users/portfolio", form, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  );
};

/** DELETE /users/portfolio/:id */
export const deletePortfolioItem = (id: number): Promise<void> =>
  unwrap(api.delete<ApiResponse<void>>(`/users/portfolio/${id}`));
