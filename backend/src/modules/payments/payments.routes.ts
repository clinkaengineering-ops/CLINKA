import { Router } from "express";
import {
  authenticate,
  authorize,
} from "../../middlewares/auth.middleware";
import { getIframeConfig } from "./fawaterk.hashkey";
import {
  fawaterkWebhookController,
  getCheckoutSessionController,
  getEscrowByIdController,
  getPaymentMethodsController,
  getProjectPaymentController,
  initiateCheckoutController,
  getEngineerBalanceController,
  listEngineerEscrowController,
  listEscrowController,
  refundEscrowController,
  releaseEscrowController,
} from "./payments.controller";

const router = Router();

router.post("/webhook_json", fawaterkWebhookController);

// IFrame hashKey — must be generated server-side (vendor key must not leak)
router.get("/iframe-config", authenticate, getIframeConfig);

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

export default router;
