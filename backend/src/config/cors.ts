/** VS Code / GitHub dev tunnel frontends: {id}-3000.uks1.devtunnels.ms */
const DEV_TUNNEL_FRONTEND =
  /^https:\/\/[\w-]+-3000\.[a-z0-9-]+\.devtunnels\.ms$/i;

export function isDevTunnelFrontendOrigin(origin: string): boolean {
  if (process.env.NODE_ENV === "production") {
    return false;
  }
  return DEV_TUNNEL_FRONTEND.test(origin);
}

export function getAllowedOrigins(): string[] {
  const origins = new Set<string>();
  const clientUrl = process.env.CLIENT_URL?.replace(/\/$/, "");
  if (clientUrl) origins.add(clientUrl);

  const publicClientUrl = process.env.PUBLIC_CLIENT_URL?.replace(/\/$/, "");
  if (publicClientUrl) origins.add(publicClientUrl);

  for (const raw of process.env.CORS_EXTRA_ORIGINS?.split(",") ?? []) {
    const trimmed = raw.trim().replace(/\/$/, "");
    if (trimmed) origins.add(trimmed);
  }

  if (process.env.NODE_ENV !== "production") {
    origins.add("http://localhost:3000");
    origins.add("http://127.0.0.1:3000");
    origins.add("http://localhost:4000");
    origins.add("http://127.0.0.1:4000");
  }

  return [...origins];
}

export function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true;
  if (getAllowedOrigins().includes(origin)) return true;
  if (isDevTunnelFrontendOrigin(origin)) return true;
  return false;
}

/** VS Code / GitHub dev tunnel backends: {id}-5000.uks1.devtunnels.ms */
const DEV_TUNNEL_BACKEND =
  /^https:\/\/[\w-]+-5000\.[a-z0-9-]+\.devtunnels\.ms$/i;

export function isDevTunnelBackendOrigin(origin: string): boolean {
  if (process.env.NODE_ENV === "production") {
    return false;
  }
  return DEV_TUNNEL_BACKEND.test(origin);
}

export function getAllowedApiOrigins(): string[] {
  const origins = new Set<string>();
  const apiUrl = process.env.API_URL?.replace(/\/api\/?$/, "").replace(/\/$/, "");
  if (apiUrl) origins.add(apiUrl);

  const googleRedirect = process.env.GOOGLE_REDIRECT_URI?.trim();
  if (googleRedirect) {
    try {
      origins.add(new URL(googleRedirect).origin);
    } catch {}
  }

  for (const o of getAllowedOrigins()) {
    origins.add(o);
  }

  if (process.env.NODE_ENV !== "production") {
    origins.add("http://localhost:5000");
    origins.add("http://127.0.0.1:5000");
    const port = process.env.PORT;
    if (port) {
      origins.add(`http://localhost:${port}`);
      origins.add(`http://127.0.0.1:${port}`);
    }
  }

  return [...origins];
}

export function isAllowedApiOrigin(origin: string | undefined): boolean {
  if (!origin) return true;
  if (getAllowedApiOrigins().includes(origin)) return true;
  if (isDevTunnelBackendOrigin(origin)) return true;
  return false;
}
