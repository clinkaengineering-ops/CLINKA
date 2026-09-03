import { Router } from "express";
import { optionalAuthenticate } from "../../middlewares/auth.middleware";
import {
  createSupportTicketController,
  getLandingSnapshotController,
  getSupportContactController,
  getPublicConfigController,
} from "./public.controller";
import { t3OptionalAuthLimiters, t5PublicListingLimiter } from "../../middlewares/rateLimit";

const router = Router();

router.get("/config", t5PublicListingLimiter, getPublicConfigController);
router.get("/landing", t5PublicListingLimiter, getLandingSnapshotController);
router.get("/support-contact", t5PublicListingLimiter, getSupportContactController);
router.post("/support-tickets", optionalAuthenticate, ...t3OptionalAuthLimiters, createSupportTicketController);

export default router;
