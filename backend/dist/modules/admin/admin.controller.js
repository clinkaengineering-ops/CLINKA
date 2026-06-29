"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminStatsController = getAdminStatsController;
exports.getPendingVerificationsController = getPendingVerificationsController;
exports.updateVerificationController = updateVerificationController;
exports.getAllBansController = getAllBansController;
exports.banUserController = banUserController;
exports.unbanUserController = unbanUserController;
exports.lookupUserController = lookupUserController;
exports.getAllConversationsController = getAllConversationsController;
exports.getConversationMessagesController = getConversationMessagesController;
exports.impersonateUserController = impersonateUserController;
exports.updateProfileByAdminController = updateProfileByAdminController;
exports.getAllProjectsController = getAllProjectsController;
exports.updateProjectStatusController = updateProjectStatusController;
exports.getAllReviewsController = getAllReviewsController;
exports.deleteReviewController = deleteReviewController;
exports.getSettingsController = getSettingsController;
exports.updateSettingsController = updateSettingsController;
exports.getAllPaymentsController = getAllPaymentsController;
exports.overridePaymentController = overridePaymentController;
exports.getAnalyticsController = getAnalyticsController;
exports.getSystemLogsController = getSystemLogsController;
exports.getSupportTicketsController = getSupportTicketsController;
exports.updateSupportTicketController = updateSupportTicketController;
exports.getWithdrawalRequestsController = getWithdrawalRequestsController;
exports.updateWithdrawalRequestStatusController = updateWithdrawalRequestStatusController;
const ApiResponse_1 = __importDefault(require("../../utils/ApiResponse"));
const admin_service_1 = require("./admin.service");
const admin_validation_1 = require("./admin.validation");
async function getAdminStatsController(_req, res, next) {
    try {
        const stats = await (0, admin_service_1.getAdminStats)();
        res.status(200).json((0, ApiResponse_1.default)(200, "Admin stats fetched", stats));
    }
    catch (error) {
        next(error);
    }
}
async function getPendingVerificationsController(_req, res, next) {
    try {
        const list = await (0, admin_service_1.getPendingVerifications)();
        res
            .status(200)
            .json((0, ApiResponse_1.default)(200, "Pending verifications fetched", list));
    }
    catch (error) {
        next(error);
    }
}
async function updateVerificationController(req, res, next) {
    try {
        const input = admin_validation_1.updateVerificationSchema.parse(req.body);
        const user = await (0, admin_service_1.updateEngineerVerification)(Number(req.params.profileId), input);
        res.status(200).json((0, ApiResponse_1.default)(200, "Verification updated", user));
    }
    catch (error) {
        next(error);
    }
}
async function getAllBansController(_req, res, next) {
    try {
        const bans = await (0, admin_service_1.getAllBans)();
        res.status(200).json((0, ApiResponse_1.default)(200, "Bans fetched", bans));
    }
    catch (error) {
        next(error);
    }
}
async function banUserController(req, res, next) {
    try {
        const input = admin_validation_1.banUserSchema.parse(req.body);
        const result = await (0, admin_service_1.banUserManually)(req.user.userId, Number(req.params.userId), input.note);
        res.status(201).json((0, ApiResponse_1.default)(201, "User banned for 30 days", result));
    }
    catch (error) {
        next(error);
    }
}
async function unbanUserController(req, res, next) {
    try {
        const result = await (0, admin_service_1.unbanUser)(req.user.userId, Number(req.params.userId));
        res.status(200).json((0, ApiResponse_1.default)(200, "User unbanned", result));
    }
    catch (error) {
        next(error);
    }
}
async function lookupUserController(req, res, next) {
    try {
        const identifier = String(req.query.identifier ?? "");
        if (!identifier.trim()) {
            res.status(400).json((0, ApiResponse_1.default)(400, "identifier query is required"));
            return;
        }
        const user = await (0, admin_service_1.lookupUser)(identifier);
        res.status(200).json((0, ApiResponse_1.default)(200, "User found", user));
    }
    catch (error) {
        next(error);
    }
}
async function getAllConversationsController(req, res, next) {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const data = await (0, admin_service_1.getAllConversations)(page, limit);
        res.status(200).json((0, ApiResponse_1.default)(200, "Conversations fetched", data));
    }
    catch (error) {
        next(error);
    }
}
async function getConversationMessagesController(req, res, next) {
    try {
        const conversationId = Number(req.params.conversationId);
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 50;
        const data = await (0, admin_service_1.getConversationMessages)(conversationId, page, limit);
        res.status(200).json((0, ApiResponse_1.default)(200, "Messages fetched", data));
    }
    catch (error) {
        next(error);
    }
}
async function impersonateUserController(req, res, next) {
    try {
        const targetUserId = Number(req.params.userId);
        const { user, token } = await (0, admin_service_1.impersonateUser)(targetUserId);
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
            maxAge: 24 * 60 * 60 * 1000,
        });
        res.status(200).json((0, ApiResponse_1.default)(200, "Impersonation successful", user));
    }
    catch (error) {
        next(error);
    }
}
async function updateProfileByAdminController(req, res, next) {
    try {
        const input = admin_validation_1.updateProfileSchema.parse(req.body);
        const targetUserId = Number(req.params.userId);
        const user = await (0, admin_service_1.updateEngineerProfileByAdmin)(targetUserId, input);
        res.status(200).json((0, ApiResponse_1.default)(200, "Profile updated successfully", user));
    }
    catch (error) {
        next(error);
    }
}
async function getAllProjectsController(req, res, next) {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const data = await (0, admin_service_1.getAllProjects)(page, limit);
        res.status(200).json((0, ApiResponse_1.default)(200, "Projects fetched", data));
    }
    catch (error) {
        next(error);
    }
}
async function updateProjectStatusController(req, res, next) {
    try {
        const input = admin_validation_1.updateProjectSchema.parse(req.body);
        const projectId = Number(req.params.projectId);
        const project = await (0, admin_service_1.updateProjectByAdmin)(projectId, input);
        res.status(200).json((0, ApiResponse_1.default)(200, "Project updated", project));
    }
    catch (error) {
        next(error);
    }
}
async function getAllReviewsController(req, res, next) {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const data = await (0, admin_service_1.getAllReviews)(page, limit);
        res.status(200).json((0, ApiResponse_1.default)(200, "Reviews fetched", data));
    }
    catch (error) {
        next(error);
    }
}
async function deleteReviewController(req, res, next) {
    try {
        const reviewId = Number(req.params.reviewId);
        await (0, admin_service_1.deleteReviewByAdmin)(reviewId);
        res.status(200).json((0, ApiResponse_1.default)(200, "Review deleted"));
    }
    catch (error) {
        next(error);
    }
}
async function getSettingsController(req, res, next) {
    try {
        const data = await (0, admin_service_1.getPlatformSettings)();
        res.status(200).json((0, ApiResponse_1.default)(200, "Settings fetched", data));
    }
    catch (error) {
        next(error);
    }
}
async function updateSettingsController(req, res, next) {
    try {
        const input = admin_validation_1.updateSettingsSchema.parse(req.body);
        const data = await (0, admin_service_1.updatePlatformSettings)(input);
        res.status(200).json((0, ApiResponse_1.default)(200, "Settings updated", data));
    }
    catch (error) {
        next(error);
    }
}
async function getAllPaymentsController(req, res, next) {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const data = await (0, admin_service_1.getAllPayments)(page, limit);
        res.status(200).json((0, ApiResponse_1.default)(200, "Payments fetched", data));
    }
    catch (error) {
        next(error);
    }
}
async function overridePaymentController(req, res, next) {
    try {
        const input = admin_validation_1.updatePaymentOverrideSchema.parse(req.body);
        const paymentId = Number(req.params.paymentId);
        const data = await (0, admin_service_1.overridePaymentStatus)(paymentId, input.status);
        res.status(200).json((0, ApiResponse_1.default)(200, "Payment overridden", data));
    }
    catch (error) {
        next(error);
    }
}
async function getAnalyticsController(_req, res, next) {
    try {
        const data = await (0, admin_service_1.getAnalyticsData)();
        res.status(200).json((0, ApiResponse_1.default)(200, "Analytics data fetched", data));
    }
    catch (error) {
        next(error);
    }
}
async function getSystemLogsController(_req, res, next) {
    try {
        const logs = await (0, admin_service_1.getSystemLogs)();
        res.status(200).json((0, ApiResponse_1.default)(200, "System logs fetched", logs));
    }
    catch (error) {
        next(error);
    }
}
async function getSupportTicketsController(req, res, next) {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const data = await (0, admin_service_1.getSupportTickets)(page, limit);
        res.status(200).json((0, ApiResponse_1.default)(200, "Support tickets fetched", data));
    }
    catch (error) {
        next(error);
    }
}
async function updateSupportTicketController(req, res, next) {
    try {
        const input = admin_validation_1.updateSupportTicketSchema.parse(req.body);
        const ticketId = Number(req.params.ticketId);
        const data = await (0, admin_service_1.updateSupportTicket)(ticketId, req.user.userId, input);
        res.status(200).json((0, ApiResponse_1.default)(200, "Support ticket updated", data));
    }
    catch (error) {
        next(error);
    }
}
async function getWithdrawalRequestsController(req, res, next) {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const data = await (0, admin_service_1.getWithdrawalRequests)(page, limit);
        res.status(200).json((0, ApiResponse_1.default)(200, "Withdrawal requests fetched", data));
    }
    catch (error) {
        next(error);
    }
}
async function updateWithdrawalRequestStatusController(req, res, next) {
    try {
        const input = admin_validation_1.updateWithdrawalRequestSchema.parse(req.body);
        const withdrawalId = Number(req.params.withdrawalId);
        const data = await (0, admin_service_1.updateWithdrawalRequestStatus)(withdrawalId, req.user.userId, input);
        res.status(200).json((0, ApiResponse_1.default)(200, "Withdrawal request updated", data));
    }
    catch (error) {
        next(error);
    }
}
