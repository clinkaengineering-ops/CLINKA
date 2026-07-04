import type { CookieOptions } from "express";
import { isDevTunnelFrontendOrigin } from "./cors";

function isLocalDevHost(host: string): boolean {
  return host.startsWith("localhost:") || host.startsWith("127.0.0.1:");
}

export function authCookieOptions(requestOrigin?: string): CookieOptions {
  const isProd = process.env.NODE_ENV === "production";
  const clientUrl = process.env.CLIENT_URL ?? "";
  const apiUrl = (
    process.env.API_URL ?? `http://localhost:${process.env.PORT ?? 5000}`
  ).replace(/\/$/, "");

  let crossHost = false;
  let useSecure = isProd || clientUrl.startsWith("https://");

  const frontendOrigin = requestOrigin ?? clientUrl;

  if (frontendOrigin) {
    useSecure = useSecure || frontendOrigin.startsWith("https://");

    if (isDevTunnelFrontendOrigin(frontendOrigin)) {
      crossHost = true;
      useSecure = true;
    } else {
      try {
        const frontendHost = new URL(frontendOrigin).host;
        const apiHost = new URL(apiUrl).host;
        crossHost = frontendHost !== apiHost;
        // localhost:3000 → localhost:5000 needs SameSite=None; Chrome allows Secure on localhost.
        if (crossHost && isLocalDevHost(frontendHost) && isLocalDevHost(apiHost)) {
          useSecure = true;
        }
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

  const needsCrossSiteCookie = crossHost && useSecure;

  return {
    httpOnly: true,
    secure: useSecure,
    sameSite: needsCrossSiteCookie ? "none" : isProd ? "strict" : "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  };
}
