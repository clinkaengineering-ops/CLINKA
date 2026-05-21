import Redis from "ioredis";

type MemoryEntry = { value: string; expiresAt?: number };
const memoryStore = new Map<string, MemoryEntry>();

let redisClient: Redis | null = null;
let redisUnavailable = false;

function memoryGet(key: string): string | null {
  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (entry.expiresAt && Date.now() > entry.expiresAt) {
    memoryStore.delete(key);
    return null;
  }
  return entry.value;
}

function memorySet(key: string, value: string, ttlSec?: number) {
  memoryStore.set(key, {
    value,
    expiresAt: ttlSec ? Date.now() + ttlSec * 1000 : undefined,
  });
}

function memoryDel(key: string) {
  memoryStore.delete(key);
}

function getRedisClient(): Redis | null {
  if (redisUnavailable || !process.env.REDIS_URL?.trim()) return null;
  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      enableOfflineQueue: false,
    });
    redisClient.on("connect", () => console.log("✅ Redis connected"));
    redisClient.on("error", (err) => {
      console.warn("Redis unavailable, using in-memory OTP store:", err.message);
      redisUnavailable = true;
    });
  }
  return redisClient;
}

export async function cacheSet(
  key: string,
  value: string,
  ttlSec: number,
): Promise<void> {
  const redis = getRedisClient();
  if (redis && !redisUnavailable) {
    try {
      await redis.set(key, value, "EX", ttlSec);
      return;
    } catch {
      redisUnavailable = true;
    }
  }
  memorySet(key, value, ttlSec);
}

export async function cacheGet(key: string): Promise<string | null> {
  const redis = getRedisClient();
  if (redis && !redisUnavailable) {
    try {
      const value = await redis.get(key);
      if (value !== null) return value;
    } catch {
      redisUnavailable = true;
    }
  }
  return memoryGet(key);
}

export async function cacheDel(key: string): Promise<void> {
  const redis = getRedisClient();
  if (redis && !redisUnavailable) {
    try {
      await redis.del(key);
      return;
    } catch {
      redisUnavailable = true;
    }
  }
  memoryDel(key);
}
