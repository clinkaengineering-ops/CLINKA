import {Router} from "express";
import {
  approveBidController,
  createBidController,
  getBidsForProjectController,
} from "./bids.controller";
import {
  authenticate,
  rejectIfBanned,
} from "../../middlewares/auth.middleware";
import { t3Limiters, t5PublicListingLimiter } from "../../middlewares/rateLimit";

const router = Router();

router.post(
  "/:projectId/bids",
  authenticate,
  rejectIfBanned("ENGINEER"),
  ...t3Limiters,
  createBidController,
);
router.get("/:projectId/bids", t5PublicListingLimiter, getBidsForProjectController);
router.put("/approve/:bidId", authenticate, ...t3Limiters, approveBidController);

export default router;