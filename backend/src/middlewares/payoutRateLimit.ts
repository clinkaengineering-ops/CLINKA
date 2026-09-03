import { RequestHandler } from "express";
import {
  PAYOUT_MAX,
  PAYOUT_WINDOW_MS,
  createUserIdRateLimit,
} from "./rateLimit";

export const payoutRateLimit: RequestHandler = createUserIdRateLimit({
  windowMs: PAYOUT_WINDOW_MS,
  max: PAYOUT_MAX,
  message: "Too many payout requests. Please try again later.",
  name: "payout.account",
  audit: true,
});
