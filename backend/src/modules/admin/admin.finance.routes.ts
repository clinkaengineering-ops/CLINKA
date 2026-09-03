import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { adminRateLimit } from "../../middlewares/adminRateLimit";
import { t2Limiters } from "../../middlewares/rateLimit";
import {
  getFinanceOverviewController,
  getUnifiedTransactionsController,
  getManualPaymentSettingsController,
  updateManualPaymentSettingsController
} from "./admin.finance.controller";

const router = Router();

router.use(authenticate, authorize("ADMIN"), adminRateLimit);

router.get("/overview", getFinanceOverviewController);
router.get("/transactions", getUnifiedTransactionsController);
router.get("/settings", getManualPaymentSettingsController);
router.patch("/settings", ...t2Limiters, updateManualPaymentSettingsController);

export default router;
