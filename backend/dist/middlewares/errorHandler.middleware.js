"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const zod_1 = require("zod");
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const ApiResponse_1 = __importDefault(require("../utils/ApiResponse"));
const zodErrors_1 = require("../utils/zodErrors");
const uploadErrors_1 = require("../utils/uploadErrors");
function errorHandler(err, req, res, next) {
    const uploadErr = (0, uploadErrors_1.resolveUploadError)(err);
    if (uploadErr) {
        res
            .status(uploadErr.statusCode)
            .json((0, ApiResponse_1.default)(uploadErr.statusCode, uploadErr.message));
        return;
    }
    if (err instanceof ApiError_1.default) {
        res.status(err.statusCode).json((0, ApiResponse_1.default)(err.statusCode, err.message));
        return;
    }
    if (err instanceof zod_1.ZodError) {
        const { message, errors } = (0, zodErrors_1.formatZodError)(err);
        res.status(400).json({
            ...(0, ApiResponse_1.default)(400, message, { errors }),
            errors,
        });
        return;
    }
    // Unknown error
    console.error(err);
    res.status(500).json((0, ApiResponse_1.default)(500, "Internal server error"));
}
