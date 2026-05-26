import { Router } from "express";
import {
  authenticate,
  authorize,
} from "../../middlewares/auth.middleware";
import {
  banUserController,
  getAdminStatsController,
  getAllBansController,
  getAllConversationsController,
  getConversationMessagesController,
  getPendingVerificationsController,
  lookupUserController,
  unbanUserController,
  updateVerificationController,
} from "./admin.controller";

const router = Router();

router.use(authenticate, authorize("ADMIN"));

router.get("/stats", getAdminStatsController);
router.get("/verifications/pending", getPendingVerificationsController);
router.patch("/verifications/:profileId", updateVerificationController);

router.get("/users/lookup", lookupUserController);
router.get("/bans", getAllBansController);
router.post("/bans/:userId", banUserController);
router.delete("/bans/:userId", unbanUserController);

router.get("/conversations", getAllConversationsController);
router.get(
  "/conversations/:conversationId/messages",
  getConversationMessagesController,
);

export default router;
