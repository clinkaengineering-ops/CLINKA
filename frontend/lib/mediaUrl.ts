import { resolveBackendOrigin } from "./apiBaseUrl";

/** Resolve stored media paths and legacy remote URLs for browser display. */
export function resolveMediaUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/uploads/")) {
    let base = resolveBackendOrigin();
    if (!base && process.env.NODE_ENV === "production") {
      base = "https://api.clinkaeng.com";
    }
    return `${base}${url}`;
  }
  return url;
}
