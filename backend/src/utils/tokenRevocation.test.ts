import {
  revokeToken,
  isTokenRevoked,
  revokeAllUserSessions,
  isUserSessionRevoked,
} from "./tokenRevocation";
import jwt from "jsonwebtoken";

describe("Token Revocation and Session Management", () => {
  const secret = "test-secret";

  beforeAll(() => {
    process.env.JWT_SECRET = secret;
  });

  describe("Single Token Revocation", () => {
    it("reports an unrevoked token as false", async () => {
      const token = jwt.sign({ userId: "user-1" }, secret, { expiresIn: "1h" });
      const revoked = await isTokenRevoked(token);
      expect(revoked).toBe(false);
    });

    it("revokes a token and reports it as revoked", async () => {
      const token = jwt.sign({ userId: "user-2" }, secret, { expiresIn: "1h" });
      await revokeToken(token);
      const revoked = await isTokenRevoked(token);
      expect(revoked).toBe(true);
    });

    it("does not affect other tokens when one is revoked", async () => {
      const tokenA = jwt.sign({ userId: "user-3" }, secret, { expiresIn: "1h" });
      const tokenB = jwt.sign({ userId: "user-4" }, secret, { expiresIn: "1h" });

      await revokeToken(tokenA);
      expect(await isTokenRevoked(tokenA)).toBe(true);
      expect(await isTokenRevoked(tokenB)).toBe(false);
    });
  });

  describe("User Session Invalidation (e.g. Password Change / Admin Action)", () => {
    it("reports session as not revoked when no user revocation is recorded", async () => {
      const nowSec = Math.floor(Date.now() / 1000);
      const revoked = await isUserSessionRevoked("user-fresh", nowSec);
      expect(revoked).toBe(false);
    });

    it("returns false if tokenIat is undefined", async () => {
      await revokeAllUserSessions("user-no-iat");
      const revoked = await isUserSessionRevoked("user-no-iat", undefined);
      expect(revoked).toBe(false);
    });

    it("revokes all sessions issued before the revocation timestamp", async () => {
      const userId = "user-session-test";
      // Token issued 10 seconds ago
      const oldIat = Math.floor((Date.now() - 10000) / 1000);

      // Trigger user session revocation now
      await revokeAllUserSessions(userId);

      // Token issued before should be revoked
      const isOldRevoked = await isUserSessionRevoked(userId, oldIat);
      expect(isOldRevoked).toBe(true);

      // Token issued in the future / after revocation should be valid
      const newIat = Math.floor((Date.now() + 5000) / 1000);
      const isNewRevoked = await isUserSessionRevoked(userId, newIat);
      expect(isNewRevoked).toBe(false);
    });
  });
});
