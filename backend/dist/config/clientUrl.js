"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClientUrl = getClientUrl;
exports.getPublicClientUrl = getPublicClientUrl;
exports.resolveOAuthClientOrigin = resolveOAuthClientOrigin;
/** Browser app origin for redirects (local dev default). */
function getClientUrl() {
    return (process.env.CLIENT_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
/**
 * Origin used in emails and post-auth redirects.
 * In development always uses CLIENT_URL (localhost) even if a dev tunnel is open.
 */
function getPublicClientUrl() {
    if (process.env.NODE_ENV !== "production") {
        return getClientUrl();
    }
    return (process.env.PUBLIC_CLIENT_URL ?? getClientUrl()).replace(/\/$/, "");
}
/** Normalize OAuth return origin — dev always lands on CLIENT_URL. */
function resolveOAuthClientOrigin(origin) {
    if (!origin)
        return undefined;
    if (process.env.NODE_ENV !== "production") {
        return getClientUrl();
    }
    return origin.replace(/\/$/, "");
}
