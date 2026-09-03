import { Router } from "express";
import {
  authenticate,
  rejectIfBanned,
} from "../../middlewares/auth.middleware";
import chatUpload from "../../middlewares/chatUpload.middleware";
import { t3Limiters, t4AccountRateLimit } from "../../middlewares/rateLimit";
import {
  getMyConversationsController,
  getMessagesController,
  sendMessageController,
  getConversationByProjectController,
  unreadMessagesCountController,
  getGeneralConversationController,
} from "./messages.controller";

const router = Router();

router.use(authenticate, rejectIfBanned());

// GET  /api/messages/conversations
router.get("/conversations", t4AccountRateLimit, getMyConversationsController);
router.get("/unread-count", t4AccountRateLimit, unreadMessagesCountController);

router.get("/conversations/:id", t4AccountRateLimit, getMessagesController);

router.get("/general/:userId", t4AccountRateLimit, getGeneralConversationController);

router.post("/conversations/:id", ...t3Limiters, (req, res, next) => {
  chatUpload.single("file")(req, res, (err) => {
    if (err) return next(err);
    void sendMessageController(req, res, next);
  });
});

// GET  /api/messages/by-project/:projectId
router.get("/by-project/:projectId", t4AccountRateLimit, getConversationByProjectController);

export default router;