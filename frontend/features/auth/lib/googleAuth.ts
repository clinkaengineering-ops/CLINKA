import { resolveApiBaseUrl, resolveSocketBaseUrl } from "@/lib/apiBaseUrl";

/** API origin including `/api`. */
export function getApiOrigin(): string {
  return resolveApiBaseUrl().replace(/\/$/, "");
}

function getClientOrigin(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return window.location.origin;
}

export function startGoogleSignIn(options?: {
  next?: string;
  role?: "CLIENT" | "ENGINEER";
}) {
  const base = getApiOrigin();
  const params = new URLSearchParams();
  if (options?.next) params.set("next", options.next);
  if (options?.role) params.set("role", options.role);

  const apiOrigin = base.replace(/\/api\/?$/, "");
  params.set("api_origin", apiOrigin);

  const clientOrigin = getClientOrigin();
  if (clientOrigin) params.set("client_origin", clientOrigin);

  const qs = params.toString();
  window.location.href = `${base}/auth/google${qs ? `?${qs}` : ""}`;
}

export { resolveSocketBaseUrl };
