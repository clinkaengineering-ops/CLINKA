"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.payoutRateLimit = payoutRateLimit;
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const rateLimits = new Map();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 3; // 3 requests per minute per user
function payoutRateLimit(req, res, next) {
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
        return next(new ApiError_1.default(429, "Too many payout requests. Please try again later."));
    }
    record.count += 1;
    next();
}
