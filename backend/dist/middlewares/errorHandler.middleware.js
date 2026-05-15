"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const ApiResponse_1 = __importDefault(require("../utils/ApiResponse"));
function errorHandler(err, req, res, next) {
    if (err instanceof ApiError_1.default) {
        res.status(err.statusCode).json((0, ApiResponse_1.default)(err.statusCode, err.message));
        return;
    }
    // Zod validation error
    if (err instanceof Error && err.name === "ZodError") {
        res.status(400).json((0, ApiResponse_1.default)(400, err.message));
        return;
    }
    // Unknown error
    console.error(err);
    res.status(500).json((0, ApiResponse_1.default)(500, "Internal server error"));
}
