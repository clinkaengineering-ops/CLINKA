import { RequestHandler } from "express";
import {
  ADMIN_MAX,
  ADMIN_WINDOW_MS,
  createUserIdRateLimit,
} from "./rateLimit";

export const adminRateLimit: RequestHandler = createUserIdRateLimit({
  windowMs: ADMIN_WINDOW_MS,
  max: ADMIN_MAX,
  message: "Too many admin requests. Please try again later.",
  name: "admin.account",
  audit: false,
});
