import jwt from "jsonwebtoken";
import {
  socketAuthMiddleware,
  checkJoinRateLimit,
  checkMessageRateLimit,
} from "./socket";
import { revokeToken, revokeAllUserSessions } from "./utils/tokenRevocation";
import * as banService from "./modules/messages/ban.service";

describe("Socket.IO Real-Time Security Boundaries", () => {
  const secret = "mock-secret-for-socket-tests-12345";

  beforeAll(() => {
    process.env.JWT_SECRET = secret;
  });

  describe("Socket Authentication Middleware", () => {
    it("rejects connection when token is completely missing", async () => {
      const socket = {
        handshake: { auth: {}, headers: {} },
      };
      const next = jest.fn();

      await socketAuthMiddleware(socket as any, next);
      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(next.mock.calls[0][0].message).toBe("Unauthorized");
    });

    it("rejects connection when token signature is invalid", async () => {
      const invalidToken = jwt.sign({ userId: "user-1", role: "CLIENT" }, "wrong-secret");
      const socket = {
        handshake: { auth: { token: invalidToken }, headers: {} },
      };
      const next = jest.fn();

      await socketAuthMiddleware(socket as any, next);
      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(next.mock.calls[0][0].message).toBe("Unauthorized");
    });

    it("rejects connection when token has been revoked", async () => {
      const token = jwt.sign({ userId: "user-revoked", role: "CLIENT" }, secret, { expiresIn: "1h" });
      await revokeToken(token);

      const socket = {
        handshake: { auth: { token }, headers: {} },
      };
      const next = jest.fn();

      await socketAuthMiddleware(socket as any, next);
      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(next.mock.calls[0][0].message).toBe("Token revoked");
    });

    it("rejects connection when user session has been revoked", async () => {
      const oldIat = Math.floor((Date.now() - 5000) / 1000);
      const token = jwt.sign({ userId: "user-session-revoked", role: "CLIENT", iat: oldIat }, secret, { expiresIn: "1h" });
      await revokeAllUserSessions("user-session-revoked");

      const socket = {
        handshake: { auth: { token }, headers: {} },
      };
      const next = jest.fn();

      await socketAuthMiddleware(socket as any, next);
      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(next.mock.calls[0][0].message).toBe("Session expired");
    });

    it("rejects connection when user account is suspended/banned", async () => {
      const token = jwt.sign({ userId: "user-banned", role: "CLIENT" }, secret, { expiresIn: "1h" });
      jest.spyOn(banService, "isUserBanned").mockResolvedValueOnce({
        banned: true,
        expiresAt: new Date(Date.now() + 86400000),
        reason: "Violation",
      });

      const socket = {
        handshake: { auth: { token }, headers: {} },
      };
      const next = jest.fn();

      await socketAuthMiddleware(socket as any, next);
      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(next.mock.calls[0][0].message).toBe("User account is suspended");
    });

    it("authenticates successfully with valid cookie", async () => {
      const token = jwt.sign({ userId: "user-valid-cookie", role: "CLIENT" }, secret, { expiresIn: "1h" });
      jest.spyOn(banService, "isUserBanned").mockResolvedValueOnce({
        banned: false,
        expiresAt: null,
      });

      const socket = {
        handshake: { headers: { cookie: `other=123; token=${token}; another=456` } },
      };
      const next = jest.fn();

      await socketAuthMiddleware(socket as any, next);
      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeUndefined();
      expect((socket as any).user.userId).toBe("user-valid-cookie");
    });
  });

  describe("Socket Rate Limiting Controls", () => {
    it("enforces join rate limits (max 20 per 10s per socket)", () => {
      const socketId = "test-socket-rate-join";
      for (let i = 0; i < 20; i++) {
        expect(checkJoinRateLimit(socketId)).toBe(true);
      }
      expect(checkJoinRateLimit(socketId)).toBe(false);
    });

    it("enforces message rate limits (max 30 per 15m per user)", () => {
      const userId = "test-user-rate-msg";
      for (let i = 0; i < 30; i++) {
        expect(checkMessageRateLimit(userId)).toBe(true);
      }
      expect(checkMessageRateLimit(userId)).toBe(false);
    });
  });
});
