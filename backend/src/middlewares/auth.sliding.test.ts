import type { Response } from "express";
import jwt from "jsonwebtoken";
import { authenticate, optionalAuthenticate, type AuthRequest } from "./auth.middleware";
import { authCookieOptions } from "../config/cookies";

describe("Sliding Session and Auth Cookies", () => {
  const secret = "test-secret-sliding";

  beforeEach(() => {
    process.env.JWT_SECRET = secret;
  });

  describe("authCookieOptions", () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
      process.env = { ...originalEnv };
      process.env.JWT_SECRET = secret;
    });

    it("defaults to sameSite=lax for same-origin production", () => {
      process.env.NODE_ENV = "production";
      process.env.CLIENT_URL = "https://clinkaeng.com";
      process.env.API_URL = "https://clinkaeng.com";

      const opts = authCookieOptions("https://clinkaeng.com");
      expect(opts.sameSite).toBe("lax");
      expect(opts.secure).toBe(true);
      expect(opts.maxAge).toBe(30 * 24 * 60 * 60 * 1000);
    });

    it("applies COOKIE_DOMAIN if set", () => {
      process.env.COOKIE_DOMAIN = ".clinkaeng.com";
      const opts = authCookieOptions();
      expect(opts.domain).toBe(".clinkaeng.com");
    });
  });

  describe("renewCookieSessionIfDue via authenticate", () => {
    it("refreshes the cookie if token has less than 80% lifetime left", async () => {
      const nowSec = Math.floor(Date.now() / 1000);
      const token = jwt.sign(
        { userId: "user-123", role: "CLIENT", iat: nowSec - 30, exp: nowSec + 70 },
        secret,
      );

      const req = {
        cookies: { token },
        headers: {},
      } as unknown as AuthRequest;

      const res = {
        cookie: jest.fn(),
      } as unknown as Response;

      const next = jest.fn();

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.user?.userId).toBe("user-123");
      expect(res.cookie).toHaveBeenCalledWith(
        "token",
        expect.any(String),
        expect.objectContaining({ maxAge: 30 * 24 * 60 * 60 * 1000 }),
      );

      const freshToken = (res.cookie as jest.Mock).mock.calls[0][1];
      const verified = jwt.verify(freshToken, secret) as any;
      expect(verified.userId).toBe("user-123");
      expect(verified.role).toBe("CLIENT");
    });

    it("does NOT refresh cookie if token is brand new (>80% remaining and >= 7d)", async () => {
      const nowSec = Math.floor(Date.now() / 1000);
      const token = jwt.sign(
        { userId: "user-fresh", role: "ENGINEER", iat: nowSec - 10, exp: nowSec + 30 * 24 * 3600 },
        secret,
      );

      const req = {
        cookies: { token },
        headers: {},
      } as unknown as AuthRequest;

      const res = {
        cookie: jest.fn(),
      } as unknown as Response;

      const next = jest.fn();

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(res.cookie).not.toHaveBeenCalled();
    });

    it("does NOT set a cookie if authenticated via Authorization Bearer header", async () => {
      const nowSec = Math.floor(Date.now() / 1000);
      const token = jwt.sign(
        { userId: "user-api", role: "CLIENT", iat: nowSec - 30, exp: nowSec + 70 },
        secret,
      );

      const req = {
        headers: { authorization: `Bearer ${token}` },
      } as unknown as AuthRequest;

      const res = {
        cookie: jest.fn(),
      } as unknown as Response;

      const next = jest.fn();

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(res.cookie).not.toHaveBeenCalled();
    });
  });

  describe("renewCookieSessionIfDue via optionalAuthenticate", () => {
    it("renews cookie on optionalAuthenticate when token is aging", async () => {
      const nowSec = Math.floor(Date.now() / 1000);
      const token = jwt.sign(
        { userId: "user-opt", role: "CLIENT", iat: nowSec - 30, exp: nowSec + 70 },
        secret,
      );

      const req = {
        cookies: { token },
        headers: {},
      } as unknown as AuthRequest;

      const res = {
        cookie: jest.fn(),
      } as unknown as Response;

      const next = jest.fn();

      await optionalAuthenticate(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user?.userId).toBe("user-opt");
      expect(res.cookie).toHaveBeenCalled();
    });
  });
});
