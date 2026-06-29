"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRegistrationEmailController = checkRegistrationEmailController;
exports.registerClientController = registerClientController;
exports.registerEngineerController = registerEngineerController;
exports.resumeEngineerRegistrationController = resumeEngineerRegistrationController;
exports.loginController = loginController;
exports.verifyEmailController = verifyEmailController;
exports.forgotPasswordController = forgotPasswordController;
exports.resetPasswordController = resetPasswordController;
exports.logoutController = logoutController;
exports.resendVerificationController = resendVerificationController;
exports.changePasswordController = changePasswordController;
exports.requestEmailChangeController = requestEmailChangeController;
exports.confirmEmailChangeController = confirmEmailChangeController;
exports.verifyOtpController = verifyOtpController;
exports.oauthSessionController = oauthSessionController;
exports.googleAuthStartController = googleAuthStartController;
exports.googleAuthCallbackController = googleAuthCallbackController;
exports.googleAuthStatusController = googleAuthStatusController;
const auth_validation_1 = require("./auth.validation");
const auth_service_1 = require("./auth.service");
const auth_validation_2 = require("./auth.validation");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_service_1 = require("../users/user.service");
const ApiResponse_1 = __importDefault(require("../../utils/ApiResponse"));
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
const cookies_1 = require("../../config/cookies");
const google_service_1 = require("./google.service");
const google_1 = require("../../config/google");
async function checkRegistrationEmailController(req, res, next) {
    try {
        const email = typeof req.query.email === "string" ? req.query.email : "";
        if (!email.trim()) {
            throw new ApiError_1.default(400, "Email is required");
        }
        const result = await (0, auth_service_1.checkRegistrationEmail)(email);
        res.status(200).json((0, ApiResponse_1.default)(200, "Registration status checked", result));
    }
    catch (error) {
        next(error);
    }
}
async function registerClientController(req, res, next) {
    try {
        const validatedData = auth_validation_1.clientRegisterSchema.parse(req.body);
        const user = await (0, auth_service_1.registerClient)(validatedData);
        res
            .status(201)
            .json((0, ApiResponse_1.default)(201, "Check your email to verify your account", user));
    }
    catch (error) {
        next(error);
    }
}
async function registerEngineerController(req, res, next) {
    try {
        const validatedData = auth_validation_1.engineerRegisterSchema.parse(req.body);
        const files = req.files;
        const documentFile = files?.document?.[0] ?? req.file;
        const fileUrl = documentFile?.path ?? "";
        const documentType = req.body.documentType;
        const portfolioUrls = (files?.portfolio ?? []).map((file) => file.path);
        const user = await (0, auth_service_1.registerEngineer)(validatedData, fileUrl, documentType, portfolioUrls);
        res
            .status(201)
            .json((0, ApiResponse_1.default)(201, "Check your email to verify your account", user));
    }
    catch (error) {
        next(error);
    }
}
async function resumeEngineerRegistrationController(req, res, next) {
    try {
        const validatedData = auth_validation_1.clientRegisterSchema.parse(req.body);
        const files = req.files;
        const portfolioUrls = (files?.portfolio ?? []).map((file) => file.path);
        const user = await (0, auth_service_1.resumeEngineerRegistration)(validatedData, portfolioUrls);
        res
            .status(200)
            .json((0, ApiResponse_1.default)(200, "Check your email to verify your account", user));
    }
    catch (error) {
        next(error);
    }
}
async function loginController(req, res, next) {
    try {
        const validatedData = auth_validation_1.loginSchema.parse(req.body);
        const result = await (0, auth_service_1.login)(validatedData);
        res.status(200).json((0, ApiResponse_1.default)(200, result.message, { userId: result.userId }));
    }
    catch (error) {
        next(error);
    }
}
async function verifyEmailController(req, res, next) {
    try {
        const { token } = req.query;
        const { token: sessionToken, userId } = await (0, auth_service_1.verifyEmail)(token);
        const user = await (0, user_service_1.getMe)(userId);
        res.cookie("token", sessionToken, (0, cookies_1.authCookieOptions)(req.headers.origin));
        res.status(200).json((0, ApiResponse_1.default)(200, "Email verified successfully", user));
    }
    catch (error) {
        next(error);
    }
}
async function forgotPasswordController(req, res, next) {
    try {
        const { email } = auth_validation_1.forgotPasswordSchema.parse(req.body);
        await (0, auth_service_1.forgotPassword)(email);
        res.status(200).json((0, ApiResponse_1.default)(200, "Reset link sent to your email"));
    }
    catch (error) {
        next(error);
    }
}
async function resetPasswordController(req, res, next) {
    try {
        const { token, newPassword } = auth_validation_1.resetPasswordSchema.parse(req.body);
        await (0, auth_service_1.resetPassword)(token, newPassword);
        res.status(200).json((0, ApiResponse_1.default)(200, "Password reset successfully"));
    }
    catch (error) {
        next(error);
    }
}
async function logoutController(req, res, next) {
    try {
        res.clearCookie("token", (0, cookies_1.authCookieOptions)(req.headers.origin));
        res.status(200).json((0, ApiResponse_1.default)(200, "Logged out successfully"));
    }
    catch (error) {
        next(error);
    }
}
async function resendVerificationController(req, res, next) {
    try {
        await (0, auth_service_1.resendVerificationEmail)(req.user.userId, req.body.email);
        res.status(200).json((0, ApiResponse_1.default)(200, "Verification email resent"));
    }
    catch (error) {
        next(error);
    }
}
async function changePasswordController(req, res, next) {
    try {
        const { oldPassword, newPassword } = auth_validation_1.changePasswordSchema.parse(req.body);
        await (0, auth_service_1.changePassword)(req.user.userId, oldPassword, newPassword);
        res.status(200).json((0, ApiResponse_1.default)(200, "Password changed successfully"));
    }
    catch (error) {
        next(error);
    }
}
async function requestEmailChangeController(req, res, next) {
    try {
        const { newEmail } = auth_validation_1.requestEmailChangeSchema.parse(req.body);
        const result = await (0, auth_service_1.requestEmailChange)(req.user.userId, newEmail);
        res.status(200).json((0, ApiResponse_1.default)(200, result.message, null));
    }
    catch (error) {
        next(error);
    }
}
async function confirmEmailChangeController(req, res, next) {
    try {
        const { otp } = auth_validation_1.confirmEmailChangeSchema.parse(req.body);
        const user = await (0, auth_service_1.confirmEmailChange)(req.user.userId, otp);
        res.status(200).json((0, ApiResponse_1.default)(200, "Email updated successfully", user));
    }
    catch (error) {
        next(error);
    }
}
async function verifyOtpController(req, res, next) {
    try {
        const { userId, otp } = auth_validation_2.verifyOtpSchema.parse(req.body);
        const result = await (0, auth_service_1.verifyOtp)(userId, otp);
        res.cookie("token", result.token, (0, cookies_1.authCookieOptions)(req.headers.origin));
        res.status(200).json((0, ApiResponse_1.default)(200, "Logged in successfully", result.user));
    }
    catch (error) {
        next(error);
    }
}
/** Exchange a short-lived OAuth session JWT for an httpOnly cookie on the frontend origin. */
async function oauthSessionController(req, res, next) {
    try {
        const { session } = auth_validation_2.oauthSessionSchema.parse(req.body);
        let payload;
        try {
            payload = jsonwebtoken_1.default.verify(session, process.env.JWT_SECRET);
        }
        catch {
            throw new ApiError_1.default(401, "Invalid or expired session");
        }
        res.cookie("token", session, (0, cookies_1.authCookieOptions)(req.headers.origin));
        const user = await (0, user_service_1.getMe)(payload.userId);
        res.status(200).json((0, ApiResponse_1.default)(200, "Signed in successfully", user));
    }
    catch (error) {
        next(error);
    }
}
async function googleAuthStartController(req, res, next) {
    try {
        if (!(0, google_1.isGoogleAuthEnabled)()) {
            throw new ApiError_1.default(503, "Google sign-in is not configured");
        }
        const next = typeof req.query.next === "string" ? req.query.next : undefined;
        const role = req.query.role === "ENGINEER" ? "ENGINEER" : "CLIENT";
        const apiOrigin = typeof req.query.api_origin === "string" ? req.query.api_origin : undefined;
        const clientOrigin = typeof req.query.client_origin === "string"
            ? req.query.client_origin
            : undefined;
        const url = (0, google_service_1.getGoogleAuthRedirectUrl)({ next, role, apiOrigin, clientOrigin });
        res.redirect(url);
    }
    catch (error) {
        next(error);
    }
}
async function googleAuthCallbackController(req, res, next) {
    try {
        const code = typeof req.query.code === "string" ? req.query.code : undefined;
        const state = typeof req.query.state === "string" ? req.query.state : undefined;
        const error = typeof req.query.error === "string" ? req.query.error : undefined;
        const result = await (0, google_service_1.handleGoogleCallback)(code, state, error);
        if (result.token) {
            res.cookie("token", result.token, (0, cookies_1.authCookieOptions)(result.clientOrigin ?? req.headers.origin));
        }
        res.redirect(result.redirectUrl);
    }
    catch (error) {
        next(error);
    }
}
async function googleAuthStatusController(_req, res, next) {
    try {
        res.status(200).json((0, ApiResponse_1.default)(200, "OK", { enabled: (0, google_1.isGoogleAuthEnabled)() }));
    }
    catch (error) {
        next(error);
    }
}
