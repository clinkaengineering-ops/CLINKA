import { Router } from "express";
import { optionalAuthenticate } from "../../middlewares/auth.middleware";
import {
  createSupportTicketController,
  getLandingSnapshotController,
  getSupportContactController,
} from "./public.controller";

const router = Router();

router.get("/landing", getLandingSnapshotController);
router.get("/support-contact", getSupportContactController);
router.post("/support-tickets", optionalAuthenticate, createSupportTicketController);

export default router;
