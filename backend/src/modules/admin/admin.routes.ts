import { Router } from "express";
import {
  authenticate,
  authorize,
} from "../../middlewares/auth.middleware";
import {
  getAdminStatsController,
  getPendingVerificationsController,
  updateVerificationController,
} from "./admin.controller";

const router = Router();

router.use(authenticate, authorize("ADMIN"));

router.get("/stats", getAdminStatsController);
router.get("/verifications/pending", getPendingVerificationsController);
router.patch("/verifications/:profileId", updateVerificationController);

export default router;
