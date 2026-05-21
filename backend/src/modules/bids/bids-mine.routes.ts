import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { listMyBidsController } from "./bids.controller";

const router = Router();

router.get("/mine", authenticate, authorize("ENGINEER"), listMyBidsController);

export default router;
