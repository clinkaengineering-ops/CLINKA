"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminStatsController = getAdminStatsController;
exports.getPendingVerificationsController = getPendingVerificationsController;
exports.updateVerificationController = updateVerificationController;
const ApiResponse_1 = __importDefault(require("../../utils/ApiResponse"));
const admin_validation_1 = require("./admin.validation");
const admin_service_1 = require("./admin.service");
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
