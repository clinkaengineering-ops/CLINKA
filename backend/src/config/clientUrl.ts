/** Browser app origin for redirects (local dev default). */
export function getClientUrl(): string {
  return (process.env.CLIENT_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/**
 * Origin used in emails and post-auth redirects.
 * In development always uses CLIENT_URL (localhost) even if a dev tunnel is open.
 */
export function getPublicClientUrl(): string {
  if (process.env.NODE_ENV !== "production") {
    return getClientUrl();
  }
  return (process.env.PUBLIC_CLIENT_URL ?? getClientUrl()).replace(/\/$/, "");
}

/** Normalize OAuth return origin — dev always lands on CLIENT_URL. */
export function resolveOAuthClientOrigin(origin?: string): string | undefined {
  if (!origin) return undefined;
  if (process.env.NODE_ENV !== "production") {
    return getClientUrl();
  }
  return origin.replace(/\/$/, "");
}
