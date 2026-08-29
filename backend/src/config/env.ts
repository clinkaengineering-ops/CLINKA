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

export function validateProductionEnv(): void {
  if (process.env.NODE_ENV !== "production") return;

  const missing = REQUIRED_IN_PRODUCTION.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    throw new Error(
      `Missing required production environment variables: ${missing.join(", ")}`,
    );
  }
}
