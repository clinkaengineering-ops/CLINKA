import { Router } from "express";
import {
  authenticate,
  authorize,
  rejectIfBanned,
} from "../../middlewares/auth.middleware";
import { listMyBidsController } from "./bids.controller";
import { t4AccountRateLimit } from "../../middlewares/rateLimit";

const router = Router();

router.get(
  "/mine",
  authenticate,
  authorize("ENGINEER"),
  rejectIfBanned("ENGINEER"),
  t4AccountRateLimit,
  listMyBidsController,
);

export default router;
