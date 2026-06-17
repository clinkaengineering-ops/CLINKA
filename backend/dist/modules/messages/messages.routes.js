"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const chatUpload_middleware_1 = __importDefault(require("../../middlewares/chatUpload.middleware"));
const messages_controller_1 = require("./messages.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate, (0, auth_middleware_1.rejectIfBanned)());
// GET  /api/messages/conversations
router.get("/conversations", messages_controller_1.getMyConversationsController);
router.get("/unread-count", messages_controller_1.unreadMessagesCountController);
// GET  /api/messages/conversations/:id?page=1&limit=30
router.get("/conversations/:id", messages_controller_1.getMessagesController);
// POST /api/messages/conversations/:id  (JSON text or multipart file + optional caption)
router.post("/conversations/:id", (req, res, next) => {
    chatUpload_middleware_1.default.single("file")(req, res, (err) => {
        if (err)
            return next(err);
        void (0, messages_controller_1.sendMessageController)(req, res, next);
    });
});
// GET  /api/messages/by-project/:projectId
router.get("/by-project/:projectId", messages_controller_1.getConversationByProjectController);
exports.default = router;
