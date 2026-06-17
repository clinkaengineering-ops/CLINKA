"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.authorize = authorize;
exports.optionalAuthenticate = optionalAuthenticate;
exports.rejectIfBanned = rejectIfBanned;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const ban_service_1 = require("../modules/messages/ban.service");
function extractToken(req) {
    const cookieToken = req.cookies?.token;
    if (cookieToken)
        return cookieToken;
    const header = req.headers.authorization;
    if (header?.startsWith("Bearer "))
        return header.slice(7).trim();
    return undefined;
}
function authenticate(req, res, next) {
    try {
        const token = extractToken(req);
        if (!token)
            throw new ApiError_1.default(401, "Not authenticated");
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = payload;
        next();
    }
    catch (error) {
        next(new ApiError_1.default(401, "Invalid or expired token"));
    }
}
function authorize(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new ApiError_1.default(403, "You don't have permission to do this"));
        }
        next();
    };
}
/** Sets req.user when a valid token is present; does not fail when absent. */
function optionalAuthenticate(req, res, next) {
    const token = extractToken(req);
    if (!token) {
        next();
        return;
    }
    try {
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = payload;
        next();
    }
    catch {
        next();
    }
}
/** Block suspended users. Optionally limit to specific roles. */
function rejectIfBanned(...roles) {
    return async (req, res, next) => {
        if (!req.user) {
            next();
            return;
        }
        if (roles.length > 0 && !roles.includes(req.user.role)) {
            next();
            return;
        }
        try {
            const banStatus = await (0, ban_service_1.isUserBanned)(req.user.userId);
            if (banStatus.banned) {
                const action = req.user.role === "ENGINEER"
                    ? "use engineer features while suspended"
                    : "use this feature while suspended";
                next(new ApiError_1.default(403, (0, ban_service_1.bannedUserMessage)(banStatus.expiresAt, action)));
                return;
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
}
