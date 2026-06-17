"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveUploadError = resolveUploadError;
const multer_1 = require("multer");
const ApiError_1 = __importDefault(require("./ApiError"));
const CHAT_ALLOWED_LABEL = "JPG, PNG, GIF, WebP, or PDF";
function resolveUploadError(err) {
    if (err instanceof ApiError_1.default)
        return err;
    if (err instanceof multer_1.MulterError) {
        switch (err.code) {
            case "LIMIT_FILE_SIZE":
                return new ApiError_1.default(400, "File is too large. Maximum size is 10 MB.");
            case "LIMIT_UNEXPECTED_FILE":
                return new ApiError_1.default(400, "Invalid upload. Please use the attachment button.");
            default:
                return new ApiError_1.default(400, err.message || "Upload failed. Please try again.");
        }
    }
    const message = err instanceof Error ? err.message : String(err);
    const code = err.code;
    const lower = message.toLowerCase();
    if (message === "FILE_FORMAT_NOT_ALLOWED" ||
        lower.includes("format") ||
        lower.includes("not allowed") ||
        lower.includes("unsupported") ||
        lower.includes("invalid image") ||
        lower.includes("invalid file")) {
        return new ApiError_1.default(400, `File format not allowed. Use ${CHAT_ALLOWED_LABEL}.`);
    }
    if (lower.includes("file size") ||
        lower.includes("too large") ||
        lower.includes("max file size")) {
        return new ApiError_1.default(400, "File is too large. Maximum size is 10 MB.");
    }
    if (code === "ETIMEDOUT" ||
        code === "ECONNRESET" ||
        code === "ESOCKETTIMEDOUT" ||
        lower.includes("timeout") ||
        lower.includes("timed out")) {
        return new ApiError_1.default(504, "Upload timed out. Check your connection and try again.");
    }
    if (lower.includes("network") ||
        lower.includes("econnrefused") ||
        lower.includes("getaddrinfo")) {
        return new ApiError_1.default(503, "Could not upload the file right now. Please try again in a moment.");
    }
    return null;
}
