"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildIframeHashKey = buildIframeHashKey;
exports.getIframeConfig = getIframeConfig;
const crypto_1 = __importDefault(require("crypto"));
const ApiResponse_1 = __importDefault(require("../../utils/ApiResponse"));
function buildIframeHashKey() {
    const vendorKey = process.env.FAWATERK_VENDOR_KEY;
    const providerKey = process.env.FAWATERK_PROVIDER_KEY;
    const domain = (process.env.CLIENT_URL ?? "http://localhost:3000").replace(/\/$/, "");
    const envType = (process.env.FAWATERK_ENV_TYPE ?? "test");
    if (!vendorKey || !providerKey) {
        if (process.env.NODE_ENV !== "production") {
            return { hashKey: "DEV_HASH_KEY_PLACEHOLDER", envType, domain };
        }
        return null;
    }
    const queryParam = `Domain=${domain}&ProviderKey=${providerKey}`;
    const hashKey = crypto_1.default
        .createHmac("sha256", vendorKey)
        .update(queryParam)
        .digest("hex");
    return { hashKey, envType, domain };
}
/** GET /api/payments/iframe-config — legacy; prefer project checkout-session */
function getIframeConfig(req, res, next) {
    try {
        const config = buildIframeHashKey();
        if (!config) {
            return res
                .status(503)
                .json((0, ApiResponse_1.default)(503, "Payment gateway not configured (FAWATERK_VENDOR_KEY / FAWATERK_PROVIDER_KEY missing)", null));
        }
        res.json((0, ApiResponse_1.default)(200, "IFrame config fetched", config));
    }
    catch (err) {
        next(err);
    }
}
