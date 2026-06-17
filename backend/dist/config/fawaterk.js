"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFawaterkConfig = getFawaterkConfig;
function getFawaterkConfig() {
    const apiToken = process.env.FAWATERK_API_TOKEN;
    if (!apiToken) {
        throw new Error("FAWATERK_API_TOKEN is not set");
    }
    return {
        baseUrl: process.env.FAWATERK_API_BASE_URL ??
            "https://app.fawaterk.com/api/v2",
        apiToken,
        vendorKey: process.env.FAWATERK_VENDOR_KEY ?? "",
        currency: process.env.FAWATERK_CURRENCY ?? "EGP",
        commissionRate: Number(process.env.PLATFORM_COMMISSION_RATE ?? "0.1"),
    };
}
