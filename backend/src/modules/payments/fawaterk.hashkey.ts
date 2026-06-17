import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import ApiResponse from "../../utils/ApiResponse";

export function buildIframeHashKey(): {
  hashKey: string;
  envType: "test" | "live";
  domain: string;
} | null {
  const vendorKey = process.env.FAWATERK_VENDOR_KEY;
  const providerKey = process.env.FAWATERK_PROVIDER_KEY;
  const domain = (process.env.CLIENT_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
  const envType = (process.env.FAWATERK_ENV_TYPE ?? "test") as "test" | "live";

  if (!vendorKey || !providerKey) {
    if (process.env.NODE_ENV !== "production") {
      return { hashKey: "DEV_HASH_KEY_PLACEHOLDER", envType, domain };
    }
    return null;
  }

  const queryParam = `Domain=${domain}&ProviderKey=${providerKey}`;
  const hashKey = crypto
    .createHmac("sha256", vendorKey)
    .update(queryParam)
    .digest("hex");

  return { hashKey, envType, domain };
}

/** GET /api/payments/iframe-config — legacy; prefer project checkout-session */
export function getIframeConfig(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const config = buildIframeHashKey();
    if (!config) {
      return res
        .status(503)
        .json(
          ApiResponse(
            503,
            "Payment gateway not configured (FAWATERK_VENDOR_KEY / FAWATERK_PROVIDER_KEY missing)",
            null,
          ),
        );
    }
    res.json(ApiResponse(200, "IFrame config fetched", config));
  } catch (err) {
    next(err);
  }
}
