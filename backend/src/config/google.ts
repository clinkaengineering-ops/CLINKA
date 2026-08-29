export function getGoogleRedirectUri(): string {
  const explicit = process.env.GOOGLE_REDIRECT_URI?.trim();
  if (explicit) return explicit;

  const apiUrl = (process.env.API_URL ?? "http://localhost:5000").replace(/\/$/, "");
  return `${apiUrl}/api/auth/google/callback`;
}

export function getGoogleClientConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    return null;
  }

  return {
    clientId,
    clientSecret,
    redirectUri: getGoogleRedirectUri(),
  };
}

export function isGoogleAuthEnabled(): boolean {
  return getGoogleClientConfig() !== null;
}
