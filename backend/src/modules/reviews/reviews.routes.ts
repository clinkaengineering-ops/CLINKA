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

const router = Router();

router.get("/engineers/:engineerId", getEngineerReviewsController);

router.get(
  "/pending",
  authenticate,
  authorize("CLIENT"),
  listPendingReviewsController,
);
router.get(
  "/mine",
  authenticate,
  authorize("CLIENT"),
  listMyReviewsController,
);
router.get(
  "/projects/:projectId/eligibility",
  authenticate,
  authorize("CLIENT"),
  canReviewProjectController,
);
router.get("/projects/:projectId", getProjectReviewController);
router.post(
  "/projects/:projectId",
  authenticate,
  authorize("CLIENT"),
  createReviewController,
);

export default router;
