import { Request, Response, NextFunction } from "express";
import ApiError from "../utils/ApiError";

const rateLimits = new Map<number, { count: number; windowStart: number }>();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 3; // 3 requests per minute per user

export function payoutRateLimit(req: Request, res: Response, next: NextFunction) {
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
    return next(new ApiError(429, "Too many payout requests. Please try again later."));
  }

  record.count += 1;
  next();
}
