import { Router } from "express";
import {
  authenticate,
  authorize,
} from "../../middlewares/auth.middleware";
import {
  canReviewProjectController,
  createReviewController,
  getEngineerReviewsController,
  getProjectReviewController,
  listMyReviewsController,
  listPendingReviewsController,
} from "./reviews.controller";
import { t3Limiters, t4AccountRateLimit, t5PublicListingLimiter } from "../../middlewares/rateLimit";

const router = Router();

router.get("/engineers/:engineerId", t5PublicListingLimiter, getEngineerReviewsController);

router.get(
  "/pending",
  authenticate,
  authorize("CLIENT"),
  t4AccountRateLimit,
  listPendingReviewsController,
);
router.get(
  "/mine",
  authenticate,
  authorize("CLIENT"),
  t4AccountRateLimit,
  listMyReviewsController,
);
router.get(
  "/projects/:projectId/eligibility",
  authenticate,
  authorize("CLIENT"),
  t4AccountRateLimit,
  canReviewProjectController,
);
router.get("/projects/:projectId", t5PublicListingLimiter, getProjectReviewController);
router.post(
  "/projects/:projectId",
  authenticate,
  authorize("CLIENT"),
  ...t3Limiters,
  createReviewController,
);

export default router;
