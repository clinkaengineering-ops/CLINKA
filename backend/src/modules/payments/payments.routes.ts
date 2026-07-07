import { Router } from "express";
import {
  authenticate,
  authorize,
} from "../../middlewares/auth.middleware";
import {
  createEngineerAutoWithdrawalController,
  paymobWebhookController,
  paymobPayoutWebhookController,
  getPaymentByGatewayController,
  getCheckoutSessionController,
  getEscrowByIdController,
  listEngineerWithdrawalsController,
  getPaymentMethodsController,
  getProjectPaymentController,
  initiateCheckoutController,
  getEngineerBalanceController,
  listEngineerEscrowController,
  listEscrowController,
  refundEscrowController,
  releaseEscrowController,
  verifyPaymentController,
  verifyCheckoutReturnController,
} from "./payments.controller";

const router = Router();

router.post("/webhook/paymob", paymobWebhookController);
router.post("/webhook/paymob/payout", paymobPayoutWebhookController);

router.get(
  "/gateway/:gatewayId",
  authenticate,
  getPaymentByGatewayController,
);

router.get("/methods", authenticate, getPaymentMethodsController);
router.get("/escrow", authenticate, authorize("CLIENT"), listEscrowController);
router.get(
  "/engineer/escrow",
  authenticate,
  authorize("ENGINEER"),
  listEngineerEscrowController,
);
router.get(
  "/engineer/balance",
  authenticate,
  authorize("ENGINEER"),
  getEngineerBalanceController,
);
/* OLD_WITHDRAWAL_START — Manual withdrawal routes (commented out for auto-withdrawal via Paymob)
router.post(
  "/engineer/withdrawals",
  authenticate,
  authorize("ENGINEER"),
  createEngineerWithdrawalController,
);
OLD_WITHDRAWAL_END */
router.get(
  "/engineer/withdrawals",
  authenticate,
  authorize("ENGINEER"),
  listEngineerWithdrawalsController,
);
import { payoutRateLimit } from "../../middlewares/payoutRateLimit";

router.post(
  "/engineer/withdrawals/auto",
  authenticate,
  authorize("ENGINEER"),
  payoutRateLimit,
  createEngineerAutoWithdrawalController,
);
router.get(
  "/escrow/:paymentId",
  authenticate,
  getEscrowByIdController,
);
router.get(
  "/projects/:projectId",
  authenticate,
  getProjectPaymentController,
);
router.get(
  "/projects/:projectId/checkout-session",
  authenticate,
  authorize("CLIENT"),
  getCheckoutSessionController,
);
router.post(
  "/projects/:projectId/checkout",
  authenticate,
  authorize("CLIENT"),
  initiateCheckoutController,
);
router.post(
  "/:paymentId/release",
  authenticate,
  authorize("CLIENT"),
  releaseEscrowController,
);
router.post(
  "/:paymentId/refund",
  authenticate,
  authorize("CLIENT"),
  refundEscrowController,
);
router.post(
  "/verify-return",
  authenticate,
  authorize("CLIENT"),
  verifyCheckoutReturnController,
);
router.post(
  "/:paymentId/verify",
  authenticate,
  authorize("CLIENT"),
  verifyPaymentController,
);

export default router;
