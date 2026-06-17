"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheSet = cacheSet;
exports.cacheGet = cacheGet;
exports.cacheDel = cacheDel;
const ioredis_1 = __importDefault(require("ioredis"));
const memoryStore = new Map();
let redisClient = null;
let redisUnavailable = false;
function memoryGet(key) {
    const entry = memoryStore.get(key);
    if (!entry)
        return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
        memoryStore.delete(key);
        return null;
    }
    return entry.value;
}
function memorySet(key, value, ttlSec) {
    memoryStore.set(key, {
        value,
        expiresAt: ttlSec ? Date.now() + ttlSec * 1000 : undefined,
    });
}
function memoryDel(key) {
    memoryStore.delete(key);
}
function getRedisClient() {
    if (redisUnavailable || !process.env.REDIS_URL?.trim())
        return null;
    if (!redisClient) {
        redisClient = new ioredis_1.default(process.env.REDIS_URL, {
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
async function cacheSet(key, value, ttlSec) {
    const redis = getRedisClient();
    if (redis && !redisUnavailable) {
        try {
            await redis.set(key, value, "EX", ttlSec);
            return;
        }
        catch {
            redisUnavailable = true;
        }
    }
    memorySet(key, value, ttlSec);
}
async function cacheGet(key) {
    const redis = getRedisClient();
    if (redis && !redisUnavailable) {
        try {
            const value = await redis.get(key);
            if (value !== null)
                return value;
        }
        catch {
            redisUnavailable = true;
        }
    }
    return memoryGet(key);
}
async function cacheDel(key) {
    const redis = getRedisClient();
    if (redis && !redisUnavailable) {
        try {
            await redis.del(key);
            return;
        }
        catch {
            redisUnavailable = true;
        }
    }
    memoryDel(key);
}
