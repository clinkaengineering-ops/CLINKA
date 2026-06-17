"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listNotificationsController = listNotificationsController;
exports.unreadCountController = unreadCountController;
exports.markReadController = markReadController;
exports.markAllReadController = markAllReadController;
exports.getPrefsController = getPrefsController;
exports.updatePrefsController = updatePrefsController;
const ApiResponse_1 = __importDefault(require("../../utils/ApiResponse"));
const notifications_validation_1 = require("./notifications.validation");
const notifications_service_1 = require("./notifications.service");
async function listNotificationsController(req, res, next) {
    try {
        const items = await (0, notifications_service_1.getNotifications)(req.user.userId);
        res.status(200).json((0, ApiResponse_1.default)(200, "OK", items));
    }
    catch (e) {
        next(e);
    }
}
async function unreadCountController(req, res, next) {
    try {
        const count = await (0, notifications_service_1.getUnreadCount)(req.user.userId);
        res.status(200).json((0, ApiResponse_1.default)(200, "OK", { count }));
    }
    catch (e) {
        next(e);
    }
}
async function markReadController(req, res, next) {
    try {
        const item = await (0, notifications_service_1.markNotificationRead)(req.user.userId, Number(req.params.id));
        res.status(200).json((0, ApiResponse_1.default)(200, "OK", item));
    }
    catch (e) {
        next(e);
    }
}
async function markAllReadController(req, res, next) {
    try {
        await (0, notifications_service_1.markAllNotificationsRead)(req.user.userId);
        res.status(200).json((0, ApiResponse_1.default)(200, "OK", null));
    }
    catch (e) {
        next(e);
    }
}
async function getPrefsController(req, res, next) {
    try {
        const prefs = await (0, notifications_service_1.getNotificationPrefs)(req.user.userId);
        res.status(200).json((0, ApiResponse_1.default)(200, "OK", prefs));
    }
    catch (e) {
        next(e);
    }
}
async function updatePrefsController(req, res, next) {
    try {
        const data = notifications_validation_1.updateNotificationPrefsSchema.parse(req.body);
        const prefs = await (0, notifications_service_1.updateNotificationPrefs)(req.user.userId, data);
        res.status(200).json((0, ApiResponse_1.default)(200, "OK", prefs));
    }
    catch (e) {
        next(e);
    }
}
