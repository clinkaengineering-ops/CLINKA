/** Map {id}-3000.devtunnels.ms → {id}-5000.devtunnels.ms for the API. */
function devTunnelApiBaseUrl(hostname: string): string | null {
  const match = hostname.match(/^([\w-]+)-3000\.([\w.-]*devtunnels\.ms)$/);
  if (!match) return null;
  return `https://${match[1]}-5000.${match[2]}/api`;
}

/** Browser-aware API base URL including `/api` suffix. */
export function resolveApiBaseUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

  if (typeof window === "undefined") return configured;

  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") {
    return "http://localhost:5000/api";
  }

  const tunnelApi = devTunnelApiBaseUrl(host);
  if (tunnelApi) return tunnelApi;

  return configured;
}

/** Socket.io server origin (API base without `/api`). */
export function resolveSocketBaseUrl(): string {
  const apiBase = resolveApiBaseUrl().replace(/\/$/, "");
  return apiBase.endsWith("/api") ? apiBase.slice(0, -4) : apiBase;
}
