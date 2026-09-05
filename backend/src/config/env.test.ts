import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { applyProductionUploadDefaults, validateProductionEnv } from "./env";

describe("production upload env", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.NODE_ENV = "production";
    delete process.env.UPLOAD_DIR;
    delete process.env.UPLOAD_BASE_URL;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("fills UPLOAD_DIR and UPLOAD_BASE_URL from API_URL so production can boot", () => {
    process.env.API_URL = "https://api.clinkaeng.com/";
    applyProductionUploadDefaults();

    assert.equal(process.env.UPLOAD_DIR, "/app/uploads");
    assert.equal(process.env.UPLOAD_BASE_URL, "https://api.clinkaeng.com");
  });

  it("strips a mistaken /uploads suffix from UPLOAD_BASE_URL", () => {
    process.env.UPLOAD_DIR = "/data/uploads";
    process.env.UPLOAD_BASE_URL = "https://api.clinkaeng.com/uploads/";
    applyProductionUploadDefaults();

    assert.equal(process.env.UPLOAD_BASE_URL, "https://api.clinkaeng.com");
  });

  it("does not fail validateProductionEnv when only upload vars were missing", () => {
    process.env.DATABASE_URL = "postgresql://x";
    process.env.JWT_SECRET = "secret";
    process.env.CLIENT_URL = "https://clinkaeng.com";
    process.env.API_URL = "https://api.clinkaeng.com";
    process.env.EMAIL_USER = "a@b.c";
    process.env.RESEND_API_KEY = "re_test";
    process.env.GOOGLE_CLIENT_ID = "id";
    process.env.GOOGLE_CLIENT_SECRET = "secret";
    process.env.PAYMOB_SECRET_KEY = "sk";
    process.env.PAYMOB_PUBLIC_KEY = "pk";
    process.env.PAYMOB_HMAC_SECRET = "hmac";
    process.env.PAYMOB_INTEGRATION_IDS = "1";

    validateProductionEnv();
    assert.equal(process.env.UPLOAD_DIR, "/app/uploads");
    assert.equal(process.env.UPLOAD_BASE_URL, "https://api.clinkaeng.com");
  });
});
