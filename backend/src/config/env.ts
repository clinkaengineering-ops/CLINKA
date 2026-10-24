import { normalizeUploadOrigin } from "./upload";

const REQUIRED_IN_PRODUCTION = [
  "DATABASE_URL",
  "JWT_SECRET",
  "CLIENT_URL",
  "API_URL",
  "EMAIL_USER",
  "RESEND_API_KEY",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "UPLOAD_BASE_URL",
  "UPLOAD_DIR",
] as const;

// Paymob credentials required only when Paymob incoming gateway is explicitly active
const PAYMOB_REQUIRED_IN_PRODUCTION = [
  "PAYMOB_SECRET_KEY",
  "PAYMOB_PUBLIC_KEY",
  "PAYMOB_HMAC_SECRET",
  "PAYMOB_INTEGRATION_IDS",
] as const;

export function applyProductionUploadDefaults(): void {
  if (!process.env.UPLOAD_DIR?.trim()) {
    process.env.UPLOAD_DIR = "/app/uploads";
  }

  if (!process.env.UPLOAD_BASE_URL?.trim() && process.env.API_URL?.trim()) {
    process.env.UPLOAD_BASE_URL = normalizeUploadOrigin(process.env.API_URL);
  } else if (process.env.UPLOAD_BASE_URL?.trim()) {
    process.env.UPLOAD_BASE_URL = normalizeUploadOrigin(process.env.UPLOAD_BASE_URL);
  }
}

export function validateProductionEnv(): void {
  if (process.env.NODE_ENV !== "production") return;

  applyProductionUploadDefaults();

  const missing = REQUIRED_IN_PRODUCTION.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    throw new Error(
      `Missing required production environment variables: ${missing.join(", ")}`,
    );
  }

  if (process.env.PAYMOB_ENABLED === "true") {
    const missingPaymob = PAYMOB_REQUIRED_IN_PRODUCTION.filter((key) => !process.env[key]?.trim());
    if (missingPaymob.length > 0) {
      throw new Error(
        `Missing required Paymob environment variables: ${missingPaymob.join(", ")}`,
      );
    }
  }
}
