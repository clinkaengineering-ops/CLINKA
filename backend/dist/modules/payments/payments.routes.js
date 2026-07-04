"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const payments_controller_1 = require("./payments.controller");
const router = (0, express_1.Router)();
router.post("/webhook/paymob", payments_controller_1.paymobWebhookController);
router.get("/gateway/:gatewayId", auth_middleware_1.authenticate, payments_controller_1.getPaymentByGatewayController);
router.get("/methods", auth_middleware_1.authenticate, payments_controller_1.getPaymentMethodsController);
router.get("/escrow", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)("CLIENT"), payments_controller_1.listEscrowController);
router.get("/engineer/escrow", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)("ENGINEER"), payments_controller_1.listEngineerEscrowController);
router.get("/engineer/balance", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)("ENGINEER"), payments_controller_1.getEngineerBalanceController);
/* OLD_WITHDRAWAL_START — Manual withdrawal routes (commented out for auto-withdrawal via Paymob)
router.post(
  "/engineer/withdrawals",
  authenticate,
  authorize("ENGINEER"),
  createEngineerWithdrawalController,
);
OLD_WITHDRAWAL_END */
router.get("/engineer/withdrawals", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)("ENGINEER"), payments_controller_1.listEngineerWithdrawalsController);
router.post("/engineer/withdrawals/auto", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)("ENGINEER"), payments_controller_1.createEngineerAutoWithdrawalController);
router.get("/escrow/:paymentId", auth_middleware_1.authenticate, payments_controller_1.getEscrowByIdController);
router.get("/projects/:projectId", auth_middleware_1.authenticate, payments_controller_1.getProjectPaymentController);
router.get("/projects/:projectId/checkout-session", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)("CLIENT"), payments_controller_1.getCheckoutSessionController);
router.post("/projects/:projectId/checkout", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)("CLIENT"), payments_controller_1.initiateCheckoutController);
router.post("/:paymentId/release", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)("CLIENT"), payments_controller_1.releaseEscrowController);
router.post("/:paymentId/refund", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)("CLIENT"), payments_controller_1.refundEscrowController);
router.post("/verify-return", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)("CLIENT"), payments_controller_1.verifyCheckoutReturnController);
router.post("/:paymentId/verify", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)("CLIENT"), payments_controller_1.verifyPaymentController);
exports.default = router;
