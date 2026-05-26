import { Router } from "express";
import {
  authenticate,
  rejectIfBanned,
} from "../../middlewares/auth.middleware";
import chatUpload from "../../middlewares/chatUpload.middleware";
import {
  getMyConversationsController,
  getMessagesController,
  sendMessageController,
  getConversationByProjectController,
  unreadMessagesCountController,
} from "./messages.controller";

const router = Router();

router.use(authenticate, rejectIfBanned());

// GET  /api/messages/conversations
router.get("/conversations", getMyConversationsController);
router.get("/unread-count", unreadMessagesCountController);

// GET  /api/messages/conversations/:id?page=1&limit=30
router.get("/conversations/:id", getMessagesController);

// POST /api/messages/conversations/:id  (JSON text or multipart file + optional caption)
router.post("/conversations/:id", (req, res, next) => {
  chatUpload.single("file")(req, res, (err) => {
    if (err) return next(err);
    void sendMessageController(req, res, next);
  });
});

// GET  /api/messages/by-project/:projectId
router.get("/by-project/:projectId", getConversationByProjectController);

export default router;