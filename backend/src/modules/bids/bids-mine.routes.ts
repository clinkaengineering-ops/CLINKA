import { Router } from "express";
import {
  authenticate,
  authorize,
  rejectIfBanned,
} from "../../middlewares/auth.middleware";
import { listMyBidsController } from "./bids.controller";

const router = Router();

router.get(
  "/mine",
  authenticate,
  authorize("ENGINEER"),
  rejectIfBanned("ENGINEER"),
  listMyBidsController,
);

export default router;
