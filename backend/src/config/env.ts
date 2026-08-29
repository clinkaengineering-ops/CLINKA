const REQUIRED_IN_PRODUCTION = [
  "DATABASE_URL",
  "JWT_SECRET",
  "CLIENT_URL",
  "API_URL",
  "EMAIL_USER",
  "RESEND_API_KEY",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "PAYMOB_SECRET_KEY",
  "PAYMOB_PUBLIC_KEY",
  "PAYMOB_HMAC_SECRET",
  "PAYMOB_INTEGRATION_IDS",
  "UPLOAD_BASE_URL",
  "UPLOAD_DIR",
] as const;

function applyProductionUploadDefaults(): void {
  if (!process.env.UPLOAD_DIR?.trim()) {
    process.env.UPLOAD_DIR = "/app/uploads";
  }

  if (!process.env.UPLOAD_BASE_URL?.trim() && process.env.API_URL?.trim()) {
    process.env.UPLOAD_BASE_URL = process.env.API_URL.replace(/\/$/, "");
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
}
