export type ImageRemotePattern = {
  protocol: "http" | "https";
  hostname: string;
};

export function remotePatternFromUrl(
  value: string | undefined,
): ImageRemotePattern | undefined {
  if (!value?.trim()) return undefined;
  try {
    const parsed = new URL(value.includes("://") ? value : `https://${value}`);
    const protocol = parsed.protocol === "https:" ? "https" : "http";
    if (!parsed.hostname) return undefined;
    return { protocol, hostname: parsed.hostname };
  } catch {
    return undefined;
  }
}

export function collectUploadImagePatterns(env: {
  backendOrigin: string;
  nextPublicBackendUrl?: string;
  nextPublicApiUrl?: string;
  nextPublicUploadBaseUrl?: string;
}): ImageRemotePattern[] {
  const uploadPatterns = new Map<string, ImageRemotePattern>();
  for (const candidate of [
    env.backendOrigin,
    env.nextPublicBackendUrl,
    env.nextPublicApiUrl,
    env.nextPublicUploadBaseUrl,
  ]) {
    const pattern = remotePatternFromUrl(candidate);
    if (pattern) {
      uploadPatterns.set(`${pattern.protocol}://${pattern.hostname}`, pattern);
    }
  }
  return [...uploadPatterns.values()];
}
