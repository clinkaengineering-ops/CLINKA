import { Request, Response, NextFunction } from "express";
import ApiError from "../utils/ApiError";

const rateLimits = new Map<number, { count: number; windowStart: number }>();
const WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_REQUESTS = 30; // 30 requests per 5 minutes per admin

export function adminRateLimit(req: Request, res: Response, next: NextFunction) {
  // @ts-ignore
  const userId = req.user?.userId;
  if (!userId) {
    return next();
  }

  const now = Date.now();
  const record = rateLimits.get(userId);

  if (!record || now - record.windowStart > WINDOW_MS) {
    rateLimits.set(userId, { count: 1, windowStart: now });
    return next();
  }

  if (record.count >= MAX_REQUESTS) {
    return next(new ApiError(429, "Too many admin requests. Please try again later."));
  }

  record.count += 1;
  next();
}
