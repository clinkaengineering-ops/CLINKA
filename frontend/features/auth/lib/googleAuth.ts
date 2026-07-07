import { resolveBackendOrigin } from "@/lib/apiBaseUrl";

/** API origin including `/api` — always the real backend (not the Next dev proxy). */
export function getApiOrigin(): string {
  return `${resolveBackendOrigin()}/api`;
}

function getClientOrigin(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return window.location.origin;
}

export function startGoogleSignIn(options?: {
  next?: string;
  role?: "CLIENT" | "ENGINEER";
  specialty?: "CIVIL" | "ARCHITECTURAL";
  bio?: string;
  nationality?: string;
}) {
  const base = getApiOrigin();
  const params = new URLSearchParams();
  if (options?.next) params.set("next", options.next);
  if (options?.role) params.set("role", options.role);
  if (options?.specialty) params.set("specialty", options.specialty);
  if (options?.bio) params.set("bio", options.bio);
  if (options?.nationality) params.set("nationality", options.nationality);

  const apiOrigin = base.replace(/\/api\/?$/, "");
  params.set("api_origin", apiOrigin);

  const clientOrigin = getClientOrigin();
  if (clientOrigin) params.set("client_origin", clientOrigin);

  const qs = params.toString();
  window.location.href = `${base}/auth/google${qs ? `?${qs}` : ""}`;
}

export { resolveSocketBaseUrl } from "@/lib/apiBaseUrl";
