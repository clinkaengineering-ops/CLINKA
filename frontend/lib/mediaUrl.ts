import { resolveBackendOrigin } from "./apiBaseUrl";

/** Resolve stored media paths and legacy remote URLs for browser display. */
export function resolveMediaUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/uploads/")) {
    return `${resolveBackendOrigin()}${url}`;
  }
  return url;
}
