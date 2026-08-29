import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import {
  getFinanceOverviewController,
  getUnifiedTransactionsController,
  getManualPaymentSettingsController,
  updateManualPaymentSettingsController
} from "./admin.finance.controller";

const router = Router();

router.use(authenticate, authorize("ADMIN"));

router.get("/overview", getFinanceOverviewController);
router.get("/transactions", getUnifiedTransactionsController);
router.get("/settings", getManualPaymentSettingsController);
router.patch("/settings", updateManualPaymentSettingsController);

export default router;
