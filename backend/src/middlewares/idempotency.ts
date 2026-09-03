import { Request, Response, NextFunction } from "express";
import { cacheGet, cacheSet, getRedisClient } from "../config/redis";
import ApiError from "../utils/ApiError";

/**
 * Idempotency middleware ensuring a request is processed only once.
 * Requires `Idempotency-Key` header.
 * Stores the response in Redis for 24 hours.
 */
export async function idempotency(req: Request, res: Response, next: NextFunction) {
  if (req.method !== "POST" && req.method !== "PATCH") {
    return next();
  }

  const key = req.headers["idempotency-key"] as string;
  if (!key) {
    // If not provided, we just skip idempotency rather than failing, 
    // to avoid breaking existing clients that don't send the header yet.
    return next();
  }

  // @ts-ignore
  const userId = req.user?.userId;
  const redisKey = `idempotency:${userId || "anon"}:${key}`;

  try {
    const redisClient = getRedisClient();
    if (!redisClient) return next();
    
    const cachedResponse = await redisClient.get(redisKey);
    if (cachedResponse) {
      const parsed = JSON.parse(cachedResponse);
      return res.status(parsed.statusCode).json(parsed.body);
    }

    // Set a flag that this request is currently being processed
    const setSuccess = await redisClient.set(redisKey, "PROCESSING", "EX", 60, "NX"); // 60s lock
    if (!setSuccess) {
      return next(new ApiError(409, "A request with this idempotency key is currently processing."));
    }

    // Intercept response to cache it
    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
      // Only cache successful or non-server-error responses
      if (res.statusCode < 500) {
        const responseToCache = {
          statusCode: res.statusCode,
          body,
        };
        // Cache for 24 hours
        redisClient.set(redisKey, JSON.stringify(responseToCache), "EX", 24 * 60 * 60).catch((err: any) => {
          console.error("Failed to cache idempotency response:", err);
        });
      } else {
        // If it's a 500 error, delete the processing lock so they can retry
        redisClient.del(redisKey).catch(console.error);
      }
      return originalJson(body);
    };

    next();
  } catch (error) {
    next(error);
  }
}
