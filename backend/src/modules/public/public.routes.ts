import { Router } from "express";
import { getLandingSnapshotController } from "./public.controller";

const router = Router();

router.get("/landing", getLandingSnapshotController);

export default router;
