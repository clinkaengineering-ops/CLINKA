import { Router } from "express";
import {
  authenticate,
  authorize,
} from "../../middlewares/auth.middleware";
import { idempotency } from "../../middlewares/idempotency";
import { payoutRateLimit } from "../../middlewares/payoutRateLimit";
import { adminRateLimit } from "../../middlewares/adminRateLimit";
import { t2Limiters, t3Limiters, t4AccountRateLimit } from "../../middlewares/rateLimit";
import {
  createEngineerWithdrawalController,
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
  t4AccountRateLimit,
  getPaymentByGatewayController,
);

router.get("/methods", authenticate, t4AccountRateLimit, getPaymentMethodsController);
router.get("/escrow", authenticate, authorize("CLIENT"), t4AccountRateLimit, listEscrowController);
router.get(
  "/engineer/escrow",
  authenticate,
  authorize("ENGINEER"),
  t4AccountRateLimit,
  listEngineerEscrowController,
);
router.get(
  "/engineer/balance",
  authenticate,
  authorize("ENGINEER"),
  t4AccountRateLimit,
  getEngineerBalanceController,
);
router.get(
  "/engineer/withdrawals",
  authenticate,
  authorize("ENGINEER"),
  t4AccountRateLimit,
  listEngineerWithdrawalsController,
);
router.post(
  "/engineer/withdrawals",
  authenticate,
  authorize("ENGINEER"),
  payoutRateLimit,
  ...t2Limiters,
  idempotency,
  createEngineerWithdrawalController,
);
router.get(
  "/escrow/:paymentId",
  authenticate,
  t4AccountRateLimit,
  getEscrowByIdController,
);
router.get(
  "/projects/:projectId",
  authenticate,
  t4AccountRateLimit,
  getProjectPaymentController,
);
router.get(
  "/projects/:projectId/checkout-session",
  authenticate,
  authorize("CLIENT"),
  t4AccountRateLimit,
  getCheckoutSessionController,
);
router.post(
  "/projects/:projectId/checkout",
  authenticate,
  authorize("CLIENT"),
  ...t2Limiters,
  initiateCheckoutController,
);
router.post(
  "/:paymentId/release",
  authenticate,
  authorize("ADMIN"),
  adminRateLimit,
  ...t2Limiters,
  idempotency,
  releaseEscrowController,
);
router.post(
  "/:paymentId/refund",
  authenticate,
  authorize("ADMIN"),
  adminRateLimit,
  ...t2Limiters,
  idempotency,
  refundEscrowController,
);
router.post(
  "/verify-return",
  authenticate,
  authorize("CLIENT"),
  ...t3Limiters,
  verifyCheckoutReturnController,
);
router.post(
  "/:paymentId/verify",
  authenticate,
  authorize("CLIENT"),
  ...t3Limiters,
  verifyPaymentController,
);

export default router;
