import {Router} from "express";
import {
  approveBidController,
  createBidController,
  getBidsForProjectController,
} from "./bids.controller";
import {
  authenticate,
  authorize,
  rejectIfBanned,
} from "../../middlewares/auth.middleware";
import { t3Limiters, t4AccountRateLimit } from "../../middlewares/rateLimit";

const router = Router();

router.post(
  "/:projectId/bids",
  authenticate,
  rejectIfBanned("ENGINEER"),
  ...t3Limiters,
  createBidController,
);
router.get("/:projectId/bids", authenticate, t4AccountRateLimit, getBidsForProjectController);
router.put("/approve/:bidId", authenticate, authorize("CLIENT"), rejectIfBanned("CLIENT"), ...t3Limiters, approveBidController);

export default router;