"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const messages_controller_1 = require("./messages.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// GET  /api/messages/conversations
router.get("/conversations", messages_controller_1.getMyConversationsController);
router.get("/unread-count", messages_controller_1.unreadMessagesCountController);
// GET  /api/messages/conversations/:id?page=1&limit=30
router.get("/conversations/:id", messages_controller_1.getMessagesController);
// POST /api/messages/conversations/:id
router.post("/conversations/:id", messages_controller_1.sendMessageController);
// GET  /api/messages/by-project/:projectId
router.get("/by-project/:projectId", messages_controller_1.getConversationByProjectController);
exports.default = router;
