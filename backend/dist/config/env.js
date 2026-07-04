"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateProductionEnv = validateProductionEnv;
const REQUIRED_IN_PRODUCTION = [
    "DATABASE_URL",
    "JWT_SECRET",
    "CLIENT_URL",
    "API_URL",
    "EMAIL_HOST",
    "EMAIL_USER",
    "EMAIL_PASS",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "PAYMOB_SECRET_KEY",
    "PAYMOB_PUBLIC_KEY",
    "PAYMOB_HMAC_SECRET",
    "PAYMOB_INTEGRATION_IDS",
];
function validateProductionEnv() {
    if (process.env.NODE_ENV !== "production")
        return;
    const missing = REQUIRED_IN_PRODUCTION.filter((key) => !process.env[key]?.trim());
    if (missing.length > 0) {
        throw new Error(`Missing required production environment variables: ${missing.join(", ")}`);
    }
    if (process.env.PAYMOB_DEV_FALLBACK === "true") {
        console.warn("⚠️  PAYMOB_DEV_FALLBACK is enabled — disable it in production.");
    }
    if (process.env.PAYMOB_PAYOUT_DEV_FALLBACK === "true") {
        console.warn("⚠️  PAYMOB_PAYOUT_DEV_FALLBACK is enabled — disable it in production.");
    }
}
