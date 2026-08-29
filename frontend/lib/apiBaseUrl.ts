function isLocalHostname(host: string): boolean {
  return host === "localhost" || host === "127.0.0.1";
}

/** Map {id}-3000.devtunnels.ms → {id}-5000.devtunnels.ms for the API. */
function devTunnelApiBaseUrl(hostname: string): string | null {
  const match = hostname.match(/^([\w-]+)-3000\.([\w.-]*devtunnels\.ms)$/);
  if (!match) return null;
  return `https://${match[1]}-5000.${match[2]}/api`;
}

function devTunnelBackendOrigin(hostname: string): string | null {
  const match = hostname.match(/^([\w-]+)-3000\.([\w.-]*devtunnels\.ms)$/);
  if (!match) return null;
  return `https://${match[1]}-5000.${match[2]}`;
}

function localBackendOrigin(): string {
  const backend =
    process.env.BACKEND_URL ??
    process.env.NEXT_PUBLIC_BACKEND_URL ??
    "http://localhost:5000";
  return backend.replace(/\/$/, "");
}

function productionApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
    "https://api.clinkaeng.com/api"
  );
}

/** Direct backend origin (no `/api`) for sockets and OAuth redirects. */
export function resolveBackendOrigin(): string {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (isLocalHostname(host)) {
      return localBackendOrigin();
    }

    const tunnel = devTunnelBackendOrigin(host);
    if (tunnel) return tunnel;
  }

  if (process.env.NODE_ENV === "development") {
    return localBackendOrigin();
  }

  const api = productionApiBaseUrl();
  return api.endsWith("/api") ? api.slice(0, -4) : api;
}

/** Browser-aware API base URL including `/api` suffix. */
export function resolveApiBaseUrl(): string {
  const production = productionApiBaseUrl();

  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (isLocalHostname(host)) {
      return "/api";
    }

    const tunnelApi = devTunnelApiBaseUrl(host);
    if (tunnelApi) return tunnelApi;

    return production;
  }

  if (process.env.NODE_ENV === "development") {
    return `${localBackendOrigin()}/api`;
  }

  return production;
}

/** Socket.io server origin (API base without `/api`). */
export function resolveSocketBaseUrl(): string {
  return resolveBackendOrigin();
}
