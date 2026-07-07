import type { CookieOptions, Response } from "express";
import { authCookieOptions } from "./cookies";

export const CHECKOUT_RETURN_COOKIE = "clinka_checkout_return";

export type CheckoutReturnCookie = {
  projectId: number;
  paymentId: number;
};

export function checkoutReturnCookieOptions(requestOrigin?: string): CookieOptions {
  return {
    ...authCookieOptions(requestOrigin),
    maxAge: 2 * 60 * 60 * 1000,
  };
}

export function setCheckoutReturnCookie(
  res: Response,
  payload: CheckoutReturnCookie,
  requestOrigin?: string,
) {
  res.cookie(
    CHECKOUT_RETURN_COOKIE,
    JSON.stringify(payload),
    checkoutReturnCookieOptions(requestOrigin),
  );
}

export function readCheckoutReturnCookie(
  raw: string | undefined,
): CheckoutReturnCookie | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as CheckoutReturnCookie;
    if (
      Number.isInteger(parsed.projectId) &&
      parsed.projectId > 0 &&
      Number.isInteger(parsed.paymentId) &&
      parsed.paymentId > 0
    ) {
      return parsed;
    }
  } catch {
    // ignore malformed cookie
  }
  return null;
}

export function clearCheckoutReturnCookie(res: Response, requestOrigin?: string) {
  res.clearCookie(CHECKOUT_RETURN_COOKIE, checkoutReturnCookieOptions(requestOrigin));
}
