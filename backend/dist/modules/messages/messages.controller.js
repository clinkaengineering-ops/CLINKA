"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyConversationsController = getMyConversationsController;
exports.getMessagesController = getMessagesController;
exports.sendMessageController = sendMessageController;
exports.unreadMessagesCountController = unreadMessagesCountController;
exports.getConversationByProjectController = getConversationByProjectController;
const messages_service_1 = require("./messages.service");
const messages_validation_1 = require("./messages.validation");
const ApiResponse_1 = __importDefault(require("../../utils/ApiResponse"));
async function getMyConversationsController(req, res, next) {
    try {
        const data = await (0, messages_service_1.getMyConversations)(req.user.userId);
        res.status(200).json((0, ApiResponse_1.default)(200, "Conversations fetched", data));
    }
    catch (error) {
        next(error);
    }
}
async function getMessagesController(req, res, next) {
    try {
        const conversationId = Number(req.params.id);
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 30;
        const data = await (0, messages_service_1.getMessages)(conversationId, req.user.userId, page, limit);
        res.status(200).json((0, ApiResponse_1.default)(200, "Messages fetched", data));
    }
    catch (error) {
        next(error);
    }
}
async function sendMessageController(req, res, next) {
    try {
        const conversationId = Number(req.params.id);
        const validatedData = messages_validation_1.sendMessageSchema.parse(req.body);
        const message = await (0, messages_service_1.sendMessage)(conversationId, req.user.userId, validatedData);
        res.status(201).json((0, ApiResponse_1.default)(201, "Message sent", message));
    }
    catch (error) {
        next(error);
    }
}
async function unreadMessagesCountController(req, res, next) {
    try {
        const count = await (0, messages_service_1.getUnreadMessagesCount)(req.user.userId);
        res.status(200).json((0, ApiResponse_1.default)(200, "OK", { count }));
    }
    catch (error) {
        next(error);
    }
}
async function getConversationByProjectController(req, res, next) {
    try {
        const projectId = Number(req.params.projectId);
        const data = await (0, messages_service_1.getConversationByProject)(projectId, req.user.userId);
        res.status(200).json((0, ApiResponse_1.default)(200, "Conversation fetched", data));
    }
    catch (error) {
        next(error);
    }
}
