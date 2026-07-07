"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CHECKOUT_RETURN_COOKIE = void 0;
exports.checkoutReturnCookieOptions = checkoutReturnCookieOptions;
exports.setCheckoutReturnCookie = setCheckoutReturnCookie;
exports.readCheckoutReturnCookie = readCheckoutReturnCookie;
exports.clearCheckoutReturnCookie = clearCheckoutReturnCookie;
const cookies_1 = require("./cookies");
exports.CHECKOUT_RETURN_COOKIE = "clinka_checkout_return";
function checkoutReturnCookieOptions(requestOrigin) {
    return {
        ...(0, cookies_1.authCookieOptions)(requestOrigin),
        maxAge: 2 * 60 * 60 * 1000,
    };
}
function setCheckoutReturnCookie(res, payload, requestOrigin) {
    res.cookie(exports.CHECKOUT_RETURN_COOKIE, JSON.stringify(payload), checkoutReturnCookieOptions(requestOrigin));
}
function readCheckoutReturnCookie(raw) {
    if (!raw?.trim())
        return null;
    try {
        const parsed = JSON.parse(raw);
        if (Number.isInteger(parsed.projectId) &&
            parsed.projectId > 0 &&
            Number.isInteger(parsed.paymentId) &&
            parsed.paymentId > 0) {
            return parsed;
        }
    }
    catch {
        // ignore malformed cookie
    }
    return null;
}
function clearCheckoutReturnCookie(res, requestOrigin) {
    res.clearCookie(exports.CHECKOUT_RETURN_COOKIE, checkoutReturnCookieOptions(requestOrigin));
}
