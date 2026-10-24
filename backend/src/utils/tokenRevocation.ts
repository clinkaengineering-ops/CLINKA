import jwt from "jsonwebtoken";
import { cacheGet, cacheSet } from "../config/redis";

export async function revokeToken(token: string): Promise<void> {
  try {
    const decoded = jwt.decode(token) as { exp?: number; userId?: string } | null;
    const nowSec = Math.floor(Date.now() / 1000);
    const ttl = decoded?.exp && decoded.exp > nowSec ? decoded.exp - nowSec : 30 * 24 * 3600;
    await cacheSet(`revoked_token:${token}`, "1", ttl);
  } catch {
    await cacheSet(`revoked_token:${token}`, "1", 30 * 24 * 3600);
  }
}

export async function isTokenRevoked(token: string): Promise<boolean> {
  try {
    const result = await cacheGet(`revoked_token:${token}`);
    return result === "1";
  } catch {
    return false;
  }
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  try {
    await cacheSet(`user_revoked_before:${userId}`, String(Date.now()), 30 * 24 * 3600);
  } catch (err) {
    console.warn("Failed to set user session revocation:", err);
  }
}

export async function isUserSessionRevoked(userId: string, tokenIat?: number): Promise<boolean> {
  if (!tokenIat) return false;
  try {
    const revokedBeforeStr = await cacheGet(`user_revoked_before:${userId}`);
    if (!revokedBeforeStr) return false;
    const revokedBefore = Number(revokedBeforeStr);
    return tokenIat * 1000 < revokedBefore;
  } catch {
    return false;
  }
}
