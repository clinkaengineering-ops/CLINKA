"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authCookieOptions = authCookieOptions;
function authCookieOptions() {
    const isProd = process.env.NODE_ENV === "production";
    const clientUrl = process.env.CLIENT_URL ?? "";
    const apiUrl = process.env.API_URL ?? "";
    let crossHost = false;
    try {
        if (clientUrl && apiUrl) {
            crossHost = new URL(clientUrl).host !== new URL(apiUrl).host;
        }
    }
    catch {
        crossHost = false;
    }
    const useSecure = isProd || clientUrl.startsWith("https://");
    return {
        httpOnly: true,
        secure: useSecure,
        sameSite: crossHost && useSecure ? "none" : isProd ? "strict" : "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
    };
}
