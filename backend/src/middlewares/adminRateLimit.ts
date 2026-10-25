import { RequestHandler } from "express";
import {
  ADMIN_MAX,
  ADMIN_READ_MAX,
  ADMIN_WINDOW_MS,
  createUserIdRateLimit,
} from "./rateLimit";

/** Mutations: 30 / 5 min per admin. */
export const adminRateLimit: RequestHandler = createUserIdRateLimit({
  windowMs: ADMIN_WINDOW_MS,
  max: ADMIN_MAX,
  message: "Too many admin requests. Please try again later.",
  name: "admin.account",
  audit: false,
});

/** Dashboard GETs: 400 / 5 min per admin. */
export const adminReadRateLimit: RequestHandler = createUserIdRateLimit({
  windowMs: ADMIN_WINDOW_MS,
  max: ADMIN_READ_MAX,
  message: "Too many admin requests. Please try again later.",
  name: "admin.read",
  audit: false,
});

function isReadMethod(method?: string) {
  const m = (method || "GET").toUpperCase();
  return m === "GET" || m === "HEAD" || m === "OPTIONS";
}

export const adminTrafficRateLimit: RequestHandler = (req, res, next) => {
  if (isReadMethod(req.method)) {
    return adminReadRateLimit(req, res, next);
  }
  return adminRateLimit(req, res, next);
};
