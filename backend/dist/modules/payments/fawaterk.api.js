"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFawaterkPaymentMethods = getFawaterkPaymentMethods;
exports.initiateFawaterkPayment = initiateFawaterkPayment;
const fawaterk_1 = require("../../config/fawaterk");
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
function formatFawaterkErrorMessage(message, status) {
    if (typeof message === "string" && message.trim())
        return message;
    if (message && typeof message === "object") {
        const parts = Object.entries(message).map(([key, value]) => {
            const text = Array.isArray(value) ? value.join(", ") : String(value);
            return `${key}: ${text}`;
        });
        if (parts.length)
            return parts.join("; ");
    }
    return `Fawaterk request failed (${status})`;
}
async function fawaterkRequest(path, options = {}) {
    const config = (0, fawaterk_1.getFawaterkConfig)();
    const url = `${config.baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
    const response = await fetch(url, {
        ...options,
        headers: {
            Authorization: `Bearer ${config.apiToken}`,
            "Content-Type": "application/json",
            ...options.headers,
        },
    });
    const text = await response.text();
    let body;
    try {
        body = text ? JSON.parse(text) : {};
    }
    catch {
        throw new ApiError_1.default(502, `Fawaterk API returned invalid JSON (${response.status})`);
    }
    if (!response.ok || body.status === "error") {
        throw new ApiError_1.default(502, formatFawaterkErrorMessage(body.message, response.status));
    }
    return body.data;
}
async function getFawaterkPaymentMethods() {
    const data = await fawaterkRequest("getPaymentmethods", { method: "GET" });
    return Array.isArray(data) ? data : [];
}
async function initiateFawaterkPayment(payload) {
    return fawaterkRequest("invoiceInitPay", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}
