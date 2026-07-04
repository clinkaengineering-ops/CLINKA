"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDevTunnelFrontendOrigin = isDevTunnelFrontendOrigin;
exports.getAllowedOrigins = getAllowedOrigins;
exports.isAllowedOrigin = isAllowedOrigin;
/** VS Code / GitHub dev tunnel frontends: {id}-3000.uks1.devtunnels.ms */
const DEV_TUNNEL_FRONTEND = /^https:\/\/[\w-]+-3000\.[\w.-]*devtunnels\.ms$/;
function isDevTunnelFrontendOrigin(origin) {
    return DEV_TUNNEL_FRONTEND.test(origin);
}
function getAllowedOrigins() {
    const origins = new Set();
    const clientUrl = process.env.CLIENT_URL?.replace(/\/$/, "");
    if (clientUrl)
        origins.add(clientUrl);
    const publicClientUrl = process.env.PUBLIC_CLIENT_URL?.replace(/\/$/, "");
    if (publicClientUrl)
        origins.add(publicClientUrl);
    for (const raw of process.env.CORS_EXTRA_ORIGINS?.split(",") ?? []) {
        const trimmed = raw.trim().replace(/\/$/, "");
        if (trimmed)
            origins.add(trimmed);
    }
    if (process.env.NODE_ENV !== "production") {
        origins.add("http://localhost:3000");
        origins.add("http://127.0.0.1:3000");
        origins.add("http://localhost:4000");
        origins.add("http://127.0.0.1:4000");
    }
    return [...origins];
}
function isAllowedOrigin(origin) {
    if (!origin)
        return true;
    if (getAllowedOrigins().includes(origin))
        return true;
    if (isDevTunnelFrontendOrigin(origin))
        return true;
    return false;
}
