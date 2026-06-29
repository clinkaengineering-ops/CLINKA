import type { CookieOptions } from "express";
import { isDevTunnelFrontendOrigin } from "./cors";

function isLocalhostHost(host: string): boolean {
  return host === "localhost" || host === "127.0.0.1" || host.startsWith("localhost:");
}

export function authCookieOptions(requestOrigin?: string): CookieOptions {
  const isProd = process.env.NODE_ENV === "production";
  const clientUrl = process.env.CLIENT_URL ?? "";
  const apiUrl = (
    process.env.API_URL ?? `http://localhost:${process.env.PORT ?? 5000}`
  ).replace(/\/$/, "");

  let crossHost = false;
  let useSecure = isProd || clientUrl.startsWith("https://");

  if (requestOrigin) {
    useSecure = useSecure || requestOrigin.startsWith("https://");

    if (isDevTunnelFrontendOrigin(requestOrigin)) {
      crossHost = true;
      useSecure = true;
    } else {
      try {
        const clientHost = new URL(requestOrigin).host;
        const apiHost = new URL(apiUrl).host;
        crossHost =
          isLocalhostHost(clientHost) && isLocalhostHost(apiHost)
            ? clientHost !== apiHost
            : clientHost !== apiHost;
      } catch {
        crossHost = false;
      }
    }
  } else {
    try {
      if (clientUrl && apiUrl) {
        crossHost = new URL(clientUrl).host !== new URL(apiUrl).host;
      }
    } catch {
      crossHost = false;
    }
    useSecure = useSecure || clientUrl.startsWith("https://");
  }

  return {
    httpOnly: true,
    secure: useSecure,
    sameSite: crossHost && useSecure ? "none" : isProd ? "strict" : "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  };
}
