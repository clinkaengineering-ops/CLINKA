"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllowedOrigins = getAllowedOrigins;
function getAllowedOrigins() {
    const origins = new Set();
    const clientUrl = process.env.CLIENT_URL?.replace(/\/$/, "");
    if (clientUrl)
        origins.add(clientUrl);
    origins.add("http://localhost:3000");
    origins.add("http://127.0.0.1:3000");
    return [...origins];
}
