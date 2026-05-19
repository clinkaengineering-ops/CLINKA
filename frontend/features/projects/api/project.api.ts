/**
 * projectApi.ts
 * Typed fetch wrappers for the CLINKA project backend.
 * Base URL is read from NEXT_PUBLIC_API_URL or defaults to /api.
 */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

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
  engineer: {
    user: ProjectEngineerUser;
  };
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

interface ApiResponse<T = undefined> {
  statusCode: number;
  message: string;
  data?: T;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function authHeaders(token?: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(res: Response): Promise<ApiResponse<T>> {
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.message ?? `HTTP ${res.status}`);
  }
  return json as ApiResponse<T>;
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

/** GET /projects — public, returns all OPEN projects */
export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch(`${BASE}/projects`);
  const json = await handleResponse<Project[]>(res);
  return json.data ?? [];
}

/** GET /projects/:id — public, single project with bids */
export async function fetchProjectById(id: number): Promise<Project> {
  const res = await fetch(`${BASE}/projects/${id}`);
  const json = await handleResponse<Project>(res);
  if (!json.data) throw new Error("Project not found");
  return json.data;
}

/** GET /projects/my — auth required, returns caller's projects */
export async function fetchMyProjects(token: string): Promise<Project[]> {
  const res = await fetch(`${BASE}/projects/my`, {
    headers: authHeaders(token),
  });
  const json = await handleResponse<Project[]>(res);
  return json.data ?? [];
}

/** POST /projects — auth required, create a project */
export async function createProject(
  payload: CreateProjectPayload,
  token: string,
): Promise<Project> {
  const res = await fetch(`${BASE}/projects`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const json = await handleResponse<Project>(res);
  if (!json.data) throw new Error("Failed to create project");
  return json.data;
}

/** PUT /projects/:id — auth required, update owned project */
export async function updateProject(
  id: number,
  payload: UpdateProjectPayload,
  token: string,
): Promise<Project> {
  const res = await fetch(`${BASE}/projects/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const json = await handleResponse<Project>(res);
  if (!json.data) throw new Error("Failed to update project");
  return json.data;
}

/** DELETE /projects/:id — auth required, delete owned OPEN project */
export async function deleteProject(id: number, token: string): Promise<void> {
  const res = await fetch(`${BASE}/projects/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  await handleResponse(res);
}
