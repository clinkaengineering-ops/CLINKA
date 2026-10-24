import request from "supertest";
import app from "../../app";
import { handleGoogleCallback } from "./google.service";

describe("Google OAuth Security Controls", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      CLIENT_URL: "https://clinka.com",
      GOOGLE_CLIENT_ID: "mock-client-id",
      GOOGLE_CLIENT_SECRET: "mock-client-secret",
      JWT_SECRET: "mock-jwt-secret-for-tests-12345678",
      NODE_ENV: "production",
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("GET /api/auth/google (googleAuthStartController)", () => {
    it("rejects unauthorized client_origin with 400", async () => {
      const res = await request(app)
        .get("/api/auth/google")
        .query({ client_origin: "https://evil.attacker.com" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Invalid client origin");
    });

    it("rejects unauthorized api_origin with 400", async () => {
      const res = await request(app)
        .get("/api/auth/google")
        .query({ api_origin: "https://evil.attacker.com" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Invalid api origin");
    });

    it("sanitizes open redirect vectors in next parameter", async () => {
      const res = await request(app)
        .get("/api/auth/google")
        .query({
          client_origin: "https://clinka.com",
          next: "//evil.attacker.com/steal-creds",
        });

      // Should redirect to Google auth URL
      expect(res.status).toBe(302);
      const location = res.headers.location;
      expect(location).toContain("https://accounts.google.com");
      // State should not contain the protocol-relative evil url
      const stateParam = new URL(location).searchParams.get("state");
      expect(stateParam).toBeDefined();
    });
  });

  describe("handleGoogleCallback Origin Sanitization", () => {
    it("falls back to CLIENT_URL when state contains an untrusted clientOrigin", async () => {
      const jwt = require("jsonwebtoken");
      const maliciousState = jwt.sign(
        {
          nonce: "test-nonce",
          redirectUri: "https://clinka.com/api/auth/google/callback",
          clientOrigin: "https://evil-phishing.com",
        },
        process.env.JWT_SECRET as string,
      );

      const result = await handleGoogleCallback(undefined, maliciousState, "access_denied");
      expect(result.redirectUrl).toContain("https://clinka.com/auth/callback");
      expect(result.redirectUrl).not.toContain("https://evil-phishing.com");
      expect(result.clientOrigin).toBeUndefined();
    });
  });
});
