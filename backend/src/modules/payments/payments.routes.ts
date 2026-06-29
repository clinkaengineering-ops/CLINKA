import { Router } from "express";
import {
  authenticate,
  authorize,
} from "../../middlewares/auth.middleware";
import {
  createEngineerWithdrawalController,
  paymobWebhookController,
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
} from "./payments.controller";

const router = Router();

router.post("/webhook/paymob", paymobWebhookController);

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
router.get(
  "/engineer/withdrawals",
  authenticate,
  authorize("ENGINEER"),
  listEngineerWithdrawalsController,
);
router.post(
  "/engineer/withdrawals",
  authenticate,
  authorize("ENGINEER"),
  createEngineerWithdrawalController,
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
  "/:paymentId/verify",
  authenticate,
  authorize("CLIENT"),
  verifyPaymentController,
);

export default router;
