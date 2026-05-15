import Redis from "ioredis";

if (!process.env.REDIS_URL) {
  throw new Error('Missing REDIS_URL in environment')
}
const redis = new Redis(process.env.REDIS_URL)

redis.on("connect", () => console.log("✅ Redis connected"));
redis.on("error", (err) => console.error("Redis error:", err));

export default redis;