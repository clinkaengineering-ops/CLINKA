import rateLimit, { ipKeyGenerator, type Options, type RateLimitRequestHandler } from "express-rate-limit";
import { NextFunction, Request, RequestHandler, Response } from "express";
import ApiError from "../utils/ApiError";
import { logSystemEvent } from "../utils/auditLogger";
import { AuthRequest } from "./auth.middleware";

/** T3/T4 first-pass guesses — revisit with production traffic, not treated as final. */
export const T1_LOGIN_MAX = 10;
export const T1_LOGIN_WINDOW_MS = 15 * 60 * 1000;
export const T1_OTP_MAX = 5;
export const T1_OTP_WINDOW_MS = 15 * 60 * 1000;
export const T1_REGISTER_MAX = 5;
export const T1_REGISTER_WINDOW_MS = 15 * 60 * 1000;

export const T2_MAX = 5;
export const T2_WINDOW_MS = 60 * 60 * 1000;

export const T3_MAX = 20;
export const T3_WINDOW_MS = 15 * 60 * 1000;

export const T4_MAX = 120;
export const T4_WINDOW_MS = 15 * 60 * 1000;

export const T5_MAX = 60;
export const T5_WINDOW_MS = 15 * 60 * 1000;

export const ADMIN_MAX = 30;
export const ADMIN_WINDOW_MS = 5 * 60 * 1000;

export const PAYOUT_MAX = 3;
export const PAYOUT_WINDOW_MS = 60 * 1000;

export function isRateLimitDisabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.RATE_LIMIT_DISABLED === "true"
  );
}

function clientIp(req: Request): string {
  const raw = req.ip || req.socket?.remoteAddress || "127.0.0.1";
  return ipKeyGenerator(raw);
}

function requestIdentity(req: Request): string | undefined {
  const userId = (req as AuthRequest).user?.userId;
  if (userId != null) return `user:${userId}`;
  const body = req.body as Record<string, unknown> | undefined;
  if (!body) return undefined;
  if (typeof body.email === "string" && body.email.trim()) {
    return `email:${body.email.trim().toLowerCase()}`;
  }
  if (typeof body.userId === "number" || typeof body.userId === "string") {
    const id = String(body.userId).trim();
    if (id) return `user:${id}`;
  }
  return undefined;
}

function retryAfterFromReset(resetTime: Date | undefined, windowMs: number): number {
  if (resetTime) {
    return Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000));
  }
  return Math.max(1, Math.ceil(windowMs / 1000));
}

function logTier12Hit(req: Request, limiterName: string) {
  const userId = (req as AuthRequest).user?.userId;
  void logSystemEvent({
    actorId: userId ?? null,
    actorRole: (req as AuthRequest).user?.role ?? "ANONYMOUS",
    action: "RATE_LIMIT_EXCEEDED",
    targetType: "RateLimit",
    targetId: limiterName,
    ipAddress: req.ip,
    userAgent: req.get?.("User-Agent"),
    afterState: { path: req.originalUrl || req.url, method: req.method },
  });
}

function setRetryAfter(res: Response, seconds: number) {
  res.setHeader("Retry-After", String(seconds));
}

type IpLimiterOpts = {
  windowMs: number;
  max: number;
  message: string;
  name: string;
  audit: boolean;
  skipIf?: (req: Request) => boolean;
  key?: (req: Request) => string;
};

function createIpRateLimiter(opts: IpLimiterOpts): RateLimitRequestHandler {
  return rateLimit({
    windowMs: opts.windowMs,
    max: opts.max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => isRateLimitDisabled() || Boolean(opts.skipIf?.(req)),
    keyGenerator: (req) => (opts.key ? opts.key(req) : `ip:${clientIp(req)}`),
    validate: { keyGeneratorIpFallback: false, xForwardedForHeader: false },
    message: { success: false, message: opts.message },
    handler: (req: Request, res: Response, _next: NextFunction, options: Options) => {
      const resetTime = (req as Request & { rateLimit?: { resetTime?: Date } }).rateLimit?.resetTime;
      setRetryAfter(res, retryAfterFromReset(resetTime, options.windowMs));
      if (opts.audit) logTier12Hit(req, opts.name);
      res.status(options.statusCode).json(options.message);
    },
  });
}

export function createUserIdRateLimit(opts: {
  windowMs: number;
  max: number;
  message: string;
  name: string;
  audit: boolean;
}): RequestHandler {
  const buckets = new Map<number, { count: number; windowStart: number }>();

  return function userIdRateLimit(req: Request, res: Response, next: NextFunction) {
    const userId = (req as AuthRequest).user?.userId;
    if (!userId) {
      return next(new ApiError(401, "Not authenticated"));
    }

    if (isRateLimitDisabled()) {
      return next();
    }

    const now = Date.now();
    const record = buckets.get(userId);

    if (!record || now - record.windowStart > opts.windowMs) {
      buckets.set(userId, { count: 1, windowStart: now });
      return next();
    }

    if (record.count >= opts.max) {
      const retryAfter = Math.max(
        1,
        Math.ceil((opts.windowMs - (now - record.windowStart)) / 1000),
      );
      setRetryAfter(res, retryAfter);
      if (opts.audit) logTier12Hit(req, opts.name);
      return next(new ApiError(429, opts.message));
    }

    record.count += 1;
    next();
  };
}

export const loginRateLimiter = createIpRateLimiter({
  windowMs: T1_LOGIN_WINDOW_MS,
  max: T1_LOGIN_MAX,
  message: "Too many login attempts. Please try again later.",
  name: "login.ip",
  audit: true,
});

export const loginIdentityRateLimiter = createIpRateLimiter({
  windowMs: T1_LOGIN_WINDOW_MS,
  max: T1_LOGIN_MAX,
  message: "Too many login attempts. Please try again later.",
  name: "login.identity",
  audit: true,
  skipIf: (req) => !requestIdentity(req),
  key: (req) => requestIdentity(req) || `ip:${clientIp(req)}`,
});

export const otpRateLimiter = createIpRateLimiter({
  windowMs: T1_OTP_WINDOW_MS,
  max: T1_OTP_MAX,
  message: "Too many OTP requests. Please try again later.",
  name: "otp.ip",
  audit: true,
});

export const otpIdentityRateLimiter = createIpRateLimiter({
  windowMs: T1_OTP_WINDOW_MS,
  max: T1_OTP_MAX,
  message: "Too many OTP requests. Please try again later.",
  name: "otp.identity",
  audit: true,
  skipIf: (req) => !requestIdentity(req),
  key: (req) => requestIdentity(req) || `ip:${clientIp(req)}`,
});

export const t1RegisterIpLimiter = createIpRateLimiter({
  windowMs: T1_REGISTER_WINDOW_MS,
  max: T1_REGISTER_MAX,
  message: "Too many registration or password-reset attempts. Please try again later.",
  name: "t1.ip",
  audit: true,
});

export const t1RegisterIdentityLimiter = createIpRateLimiter({
  windowMs: T1_REGISTER_WINDOW_MS,
  max: T1_REGISTER_MAX,
  message: "Too many registration or password-reset attempts. Please try again later.",
  name: "t1.identity",
  audit: true,
  skipIf: (req) => !requestIdentity(req),
  key: (req) => requestIdentity(req) || `ip:${clientIp(req)}`,
});

export const manualSubmitRateLimiter = createIpRateLimiter({
  windowMs: T2_WINDOW_MS,
  max: T2_MAX,
  message: "Too many manual payment submissions. Please wait before submitting again.",
  name: "manualSubmit.ip",
  audit: true,
});

export const t2IpRateLimiter = createIpRateLimiter({
  windowMs: T2_WINDOW_MS,
  max: T2_MAX,
  message: "Too many financial requests. Please try again later.",
  name: "t2.ip",
  audit: true,
});

export const t2AccountRateLimit = createUserIdRateLimit({
  windowMs: T2_WINDOW_MS,
  max: T2_MAX,
  message: "Too many financial requests. Please try again later.",
  name: "t2.account",
  audit: true,
});

export const t3IpRateLimiter = createIpRateLimiter({
  windowMs: T3_WINDOW_MS,
  max: T3_MAX,
  message: "Too many requests. Please try again later.",
  name: "t3.ip",
  audit: false,
});

export const t3AccountRateLimit = createUserIdRateLimit({
  windowMs: T3_WINDOW_MS,
  max: T3_MAX,
  message: "Too many requests. Please try again later.",
  name: "t3.account",
  audit: false,
});

export const t4AccountRateLimit = createIpRateLimiter({
  windowMs: T4_WINDOW_MS,
  max: T4_MAX,
  message: "Too many requests. Please try again later.",
  name: "t4",
  audit: false,
  key: (req) => {
    const identity = requestIdentity(req);
    return identity || `ip:${clientIp(req)}`;
  },
});

export const t5PublicListingLimiter = createIpRateLimiter({
  windowMs: T5_WINDOW_MS,
  max: T5_MAX,
  message: "Too many requests. Please try again later.",
  name: "t5.ip",
  audit: false,
});

export const t1LoginLimiters: RequestHandler[] = [loginRateLimiter, loginIdentityRateLimiter];
export const t1OtpLimiters: RequestHandler[] = [otpRateLimiter, otpIdentityRateLimiter];
export const t1RegisterLimiters: RequestHandler[] = [t1RegisterIpLimiter, t1RegisterIdentityLimiter];
export const t2Limiters: RequestHandler[] = [t2IpRateLimiter, t2AccountRateLimit];
export const t3Limiters: RequestHandler[] = [t3IpRateLimiter, t3AccountRateLimit];

/** Optional-auth writes (support tickets): IP always; account only when logged in. */
export function t3AccountIfPresentRateLimit(req: Request, res: Response, next: NextFunction) {
  if (!(req as AuthRequest).user?.userId) {
    return next();
  }
  return t3AccountRateLimit(req, res, next);
}

export const t3OptionalAuthLimiters: RequestHandler[] = [t3IpRateLimiter, t3AccountIfPresentRateLimit];
