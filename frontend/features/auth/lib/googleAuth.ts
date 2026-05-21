/** API origin including `/api` (matches NEXT_PUBLIC_API_URL). */
export function getApiOrigin(): string {
  const configured =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

  if (typeof window === "undefined") return configured.replace(/\/$/, "");

  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") {
    return "http://localhost:5000/api";
  }

  return configured.replace(/\/$/, "");
}

export function startGoogleSignIn(options?: {
  next?: string;
  role?: "CLIENT" | "ENGINEER";
}) {
  const base = getApiOrigin();
  const params = new URLSearchParams();
  if (options?.next) params.set("next", options.next);
  if (options?.role) params.set("role", options.role);
  const qs = params.toString();
  window.location.href = `${base}/auth/google${qs ? `?${qs}` : ""}`;
}
