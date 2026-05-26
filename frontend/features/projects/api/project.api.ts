/**
 * project.api.ts — typed wrappers for /api/projects (cookie auth via axios).
 */
import api from "@/lib/axios";
import type { ApiResponse } from "@/features/engineers/api/engineer.api";

const unwrap = <T>(promise: Promise<{ data: ApiResponse<T> }>) =>
  promise.then((r) => r.data.data);

// ─── Types ────────────────────────────────────────────────────────────────────

export type ServiceType = "DESIGN" | "SUPERVISION" | "REVIEW";

export type ProjectStatus = "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface ProjectClient {
  id: number;
  name: string;
}

export interface ProjectEngineerUser {
  id: number;
  name: string;
}

export interface ProjectBid {
  id: number;
  price: number;
  duration: string;
  description: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  engineer: {
    user: ProjectEngineerUser;
  };
}

export interface ProjectReview {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  client?: { id: number; name: string };
}

export interface Project {
  id: number;
  title: string;
  description: string;
  budget: number;
  serviceType: ServiceType;
  status: ProjectStatus;
  clientId: number;
  createdAt: string;
  updatedAt: string;
  client?: ProjectClient;
  bids?: ProjectBid[];
  review?: ProjectReview | null;
  _count?: { bids: number };
}

export interface CreateProjectPayload {
  title: string;
  description: string;
  budget: number;
  serviceType: ServiceType;
}

export interface UpdateProjectPayload {
  title?: string;
  description?: string;
  budget?: number;
  serviceType?: ServiceType;
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

/** GET /projects — public OPEN projects */
export const fetchProjects = (params?: {
  q?: string;
  serviceType?: string;
}): Promise<Project[]> =>
  unwrap(api.get<ApiResponse<Project[]>>("/projects", { params })).then(
    (d) => d ?? [],
  );

/** GET /projects/:id — public, includes bids */
export const fetchProjectById = (id: number): Promise<Project> =>
  unwrap(api.get<ApiResponse<Project>>(`/projects/${id}`)).then((p) => {
    if (!p) throw new Error("Project not found");
    return p;
  });

/** GET /projects/my — authenticated client's projects */
export const fetchMyProjects = (): Promise<Project[]> =>
  unwrap(api.get<ApiResponse<Project[]>>("/projects/my")).then((d) => d ?? []);

/** GET /projects/assigned — engineer's accepted contracts */
export const fetchAssignedProjects = (): Promise<Project[]> =>
  unwrap(api.get<ApiResponse<Project[]>>("/projects/assigned")).then(
    (d) => d ?? [],
  );

/** POST /projects */
export const createProject = (payload: CreateProjectPayload): Promise<Project> =>
  unwrap(api.post<ApiResponse<Project>>("/projects", payload)).then((p) => {
    if (!p) throw new Error("Failed to create project");
    return p;
  });

/** PUT /projects/:id */
export const updateProject = (
  id: number,
  payload: UpdateProjectPayload,
): Promise<Project> =>
  unwrap(api.put<ApiResponse<Project>>(`/projects/${id}`, payload)).then((p) => {
    if (!p) throw new Error("Failed to update project");
    return p;
  });

/** DELETE /projects/:id */
export const deleteProject = (id: number): Promise<void> =>
  api.delete(`/projects/${id}`).then(() => undefined);

export async function markProjectFinished(projectId: number): Promise<void> {
  await api.patch(`/projects/${projectId}/finish`);
}