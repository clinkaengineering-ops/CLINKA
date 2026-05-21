import type { CookieOptions } from "express";

export function authCookieOptions(): CookieOptions {
  const isProd = process.env.NODE_ENV === "production";
  const clientUrl = process.env.CLIENT_URL ?? "";
  const apiUrl = process.env.API_URL ?? "";

  let crossHost = false;
  try {
    if (clientUrl && apiUrl) {
      crossHost = new URL(clientUrl).host !== new URL(apiUrl).host;
    }
  } catch {
    crossHost = false;
  }

  const useSecure = isProd || clientUrl.startsWith("https://");

  return {
    httpOnly: true,
    secure: useSecure,
    sameSite: crossHost && useSecure ? "none" : isProd ? "strict" : "lax",
    maxAge: 60 * 60 * 1000,
  };
}
