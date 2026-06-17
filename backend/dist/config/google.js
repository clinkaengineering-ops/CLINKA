"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGoogleRedirectUri = getGoogleRedirectUri;
exports.getGoogleClientConfig = getGoogleClientConfig;
exports.isGoogleAuthEnabled = isGoogleAuthEnabled;
function getGoogleRedirectUri() {
    const explicit = process.env.GOOGLE_REDIRECT_URI?.trim();
    if (explicit)
        return explicit;
    const apiUrl = (process.env.API_URL ?? "http://localhost:5000").replace(/\/$/, "");
    return `${apiUrl}/api/auth/google/callback`;
}
function getGoogleClientConfig() {
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
function isGoogleAuthEnabled() {
    return getGoogleClientConfig() !== null;
}
