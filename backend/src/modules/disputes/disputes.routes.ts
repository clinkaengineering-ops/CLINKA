import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { t2Limiters } from "../../middlewares/rateLimit";
import { 
  openDisputeController, 
  resolveDisputeController, 
  escalateDisputeController,
  manualFreezeController
} from "./disputes.controller";
import { idempotency } from "../../middlewares/idempotency";
import { adminRateLimit } from "../../middlewares/adminRateLimit";

const router = Router();

router.post("/open", authenticate, ...t2Limiters, idempotency, openDisputeController);
router.post("/escalate", authenticate, ...t2Limiters, idempotency, escalateDisputeController);

// Admin only routes
router.post("/resolve", authenticate, authorize("ADMIN"), adminRateLimit, ...t2Limiters, idempotency, resolveDisputeController);
router.post("/manual-freeze", authenticate, authorize("ADMIN"), adminRateLimit, ...t2Limiters, idempotency, manualFreezeController);

export default router;
