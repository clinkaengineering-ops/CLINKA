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
  impersonateUserController,
  updateProfileByAdminController,
  getAllProjectsController,
  updateProjectStatusController,
  getAllReviewsController,
  deleteReviewController,
  getSettingsController,
  updateSettingsController,
  getAllPaymentsController,
  overridePaymentController,
  getAnalyticsController,
  getSystemLogsController,
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

router.post("/impersonate/:userId", impersonateUserController);
router.patch("/profiles/:userId", updateProfileByAdminController);

router.get("/projects", getAllProjectsController);
router.patch("/projects/:projectId/status", updateProjectStatusController);

router.get("/reviews", getAllReviewsController);
router.delete("/reviews/:reviewId", deleteReviewController);

router.get("/settings", getSettingsController);
router.patch("/settings", updateSettingsController);

router.get("/payments", getAllPaymentsController);
router.patch("/payments/:paymentId/override", overridePaymentController);

router.get("/analytics", getAnalyticsController);
router.get("/logs", getSystemLogsController);

export default router;
