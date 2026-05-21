"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function ApiResponse(statusCode, message, data) {
    return {
        success: statusCode >= 200 && statusCode < 400,
        message,
        data
    };
}
exports.default = ApiResponse;
