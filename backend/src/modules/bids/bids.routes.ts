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

const router = Router();

router.post(
  "/:projectId/bids",
  authenticate,
  rejectIfBanned("ENGINEER"),
  createBidController,
);
router.get("/:projectId/bids", getBidsForProjectController);
router.put("/approve/:bidId", authenticate, approveBidController);

export default router;