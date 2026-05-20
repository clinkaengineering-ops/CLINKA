import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import {
  getMyConversationsController,
  getMessagesController,
  sendMessageController,
  getConversationByProjectController,
} from "./messages.controller";

const router = Router();

router.use(authenticate);

// GET  /api/messages/conversations
router.get("/conversations", getMyConversationsController);

// GET  /api/messages/conversations/:id?page=1&limit=30
router.get("/conversations/:id", getMessagesController);

// POST /api/messages/conversations/:id
router.post("/conversations/:id", sendMessageController);

// GET  /api/messages/by-project/:projectId
router.get("/by-project/:projectId", getConversationByProjectController);

export default router;