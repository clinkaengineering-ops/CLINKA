/**
 * project.api.ts — typed wrappers for /api/projects (cookie auth via axios).
 */
import api from "@/lib/axios";
import type { ApiResponse } from "@/features/engineers/api/engineer.api";
import type { ProjectStatus } from "../utils/projectStatus";

export type { ProjectStatus } from "../utils/projectStatus";

export type ServiceType = "DESIGN" | "SUPERVISION" | "REVIEW";

const unwrap = <T>(promise: Promise<{ data: ApiResponse<T> }>) =>
  promise.then((r) => r.data.data);

export interface ProjectClient {
  id: string;
  name: string;
}

export interface ProjectEngineerUser {
  id: string;
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
  client?: { id: string; name: string };
}

export interface ProjectPermissions {
  canEditContent: boolean;
  canToggleStatus: boolean;
  editTier: "FULL" | "STATUS_ONLY" | "LOCKED";
  lockReason: string | null;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  budget: number;
  serviceType: ServiceType;
  status: ProjectStatus;
  clientId: string;
  progressNote?: string | null;
  progressUpdatedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  disputeWindowClosesAt?: string | null;
  disputePausedAt?: string | null;
  disputes?: { id: number; status: string; reason: string }[];
  client?: ProjectClient;
  bids?: ProjectBid[];
  review?: ProjectReview | null;
  payment?: { id: number; status: string; amountUsd: number; commission: number; manualSubmissions?: { status: string }[]; } | null;
  submissions?: ProjectSubmission[];
  _count?: { bids: number };
  permissions?: ProjectPermissions;
}

export interface ProjectDeliverable {
  id: number;
  type: "FILE" | "LINK";
  url: string;
  name: string | null;
  mimeType: string | null;
  createdAt: string;
}

export interface ProjectSubmission {
  id: number;
  projectId: string;
  notes: string | null;
  revisionNote: string | null;
  createdAt: string;
  deliverables: ProjectDeliverable[];
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
  status?: "OPEN" | "CLOSED";
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
export const fetchProjectById = (id: string): Promise<Project> =>
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
  id: string,
  payload: UpdateProjectPayload,
): Promise<Project> =>
  unwrap(api.put<ApiResponse<Project>>(`/projects/${id}`, payload)).then((p) => {
    if (!p) throw new Error("Failed to update project");
    return p;
  });

/** DELETE /projects/:id */
export const deleteProject = (id: string): Promise<void> =>
  api.delete(`/projects/${id}`).then(() => undefined);

export async function markProjectFinished(projectId: string): Promise<void> {
  await api.patch(`/projects/${projectId}/finish`);
}

export async function submitProjectWork(
  projectId: string,
  payload: { notes?: string; links?: { url: string; name?: string }[]; files?: File[] },
): Promise<void> {
  const form = new FormData();
  if (payload.notes) form.append("notes", payload.notes);
  if (payload.links?.length) form.append("links", JSON.stringify(payload.links));
  for (const file of payload.files ?? []) {
    form.append("files", file);
  }
  await api.post(`/projects/${projectId}/submit-work`, form);
}

export async function requestProjectRevision(
  projectId: string,
  note: string,
): Promise<void> {
  await api.post(`/projects/${projectId}/request-revision`, { note });
}

export async function approveProjectWork(projectId: string): Promise<void> {
  await api.post(`/projects/${projectId}/approve`);
}

export async function updateProjectProgress(
  projectId: string,
  note: string,
): Promise<void> {
  await api.patch(`/projects/${projectId}/progress`, { note });
}

export const openDispute = (projectId: string, reason: string) =>
  unwrap(api.post<ApiResponse<any>>(`/disputes/open`, { projectId, reason }));

export async function fetchProjectSubmissions(
  projectId: string,
): Promise<ProjectSubmission[]> {
  return unwrap(
    api.get<ApiResponse<ProjectSubmission[]>>(`/projects/${projectId}/submissions`),
  ).then((d) => d ?? []);
}