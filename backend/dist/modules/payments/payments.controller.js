"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaymentMethodsController = getPaymentMethodsController;
exports.getCheckoutSessionController = getCheckoutSessionController;
exports.initiateCheckoutController = initiateCheckoutController;
exports.getProjectPaymentController = getProjectPaymentController;
exports.listEscrowController = listEscrowController;
exports.listEngineerEscrowController = listEngineerEscrowController;
exports.getEngineerBalanceController = getEngineerBalanceController;
exports.listEngineerWithdrawalsController = listEngineerWithdrawalsController;
exports.createEngineerAutoWithdrawalController = createEngineerAutoWithdrawalController;
exports.releaseEscrowController = releaseEscrowController;
exports.getEscrowByIdController = getEscrowByIdController;
exports.refundEscrowController = refundEscrowController;
exports.paymobWebhookController = paymobWebhookController;
exports.paymobPayoutWebhookController = paymobPayoutWebhookController;
exports.getPaymentByGatewayController = getPaymentByGatewayController;
exports.verifyCheckoutReturnController = verifyCheckoutReturnController;
exports.verifyPaymentController = verifyPaymentController;
const ApiResponse_1 = __importDefault(require("../../utils/ApiResponse"));
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
const payments_validation_1 = require("./payments.validation");
const checkoutCookie_1 = require("../../config/checkoutCookie");
const payments_service_1 = require("./payments.service");
async function getPaymentMethodsController(_req, res, next) {
    try {
        const methods = await (0, payments_service_1.listPaymentMethods)();
        res
            .status(200)
            .json((0, ApiResponse_1.default)(200, "Payment methods fetched successfully", methods));
    }
    catch (error) {
        next(error);
    }
}
async function getCheckoutSessionController(req, res, next) {
    try {
        const projectId = Number(req.params.projectId);
        const phone = typeof req.query.phone === "string" ? req.query.phone : undefined;
        const address = typeof req.query.address === "string" ? req.query.address : undefined;
        const session = await (0, payments_service_1.prepareProjectCheckoutSession)(req.user.userId, projectId, phone, address);
        (0, checkoutCookie_1.setCheckoutReturnCookie)(res, { projectId: session.projectId, paymentId: session.paymentId }, req.headers.origin);
        res.status(200).json((0, ApiResponse_1.default)(200, "Checkout session ready", session));
    }
    catch (error) {
        next(error);
    }
}
async function initiateCheckoutController(req, res, next) {
    try {
        const projectId = Number(req.params.projectId);
        const input = payments_validation_1.initiateCheckoutSchema.parse(req.body);
        const result = await (0, payments_service_1.initiateProjectCheckout)(req.user.userId, projectId, input);
        (0, checkoutCookie_1.setCheckoutReturnCookie)(res, { projectId, paymentId: result.payment.id }, req.headers.origin);
        res
            .status(200)
            .json((0, ApiResponse_1.default)(200, "Payment session created successfully", result));
    }
    catch (error) {
        next(error);
    }
}
async function getProjectPaymentController(req, res, next) {
    try {
        const projectId = Number(req.params.projectId);
        const payment = await (0, payments_service_1.getProjectPayment)(projectId, req.user.userId);
        res
            .status(200)
            .json((0, ApiResponse_1.default)(200, "Payment fetched successfully", payment));
    }
    catch (error) {
        next(error);
    }
}
async function listEscrowController(req, res, next) {
    try {
        const items = await (0, payments_service_1.listClientEscrow)(req.user.userId);
        res
            .status(200)
            .json((0, ApiResponse_1.default)(200, "Escrow items fetched successfully", items));
    }
    catch (error) {
        next(error);
    }
}
async function listEngineerEscrowController(req, res, next) {
    try {
        const items = await (0, payments_service_1.listEngineerEscrow)(req.user.userId);
        res
            .status(200)
            .json((0, ApiResponse_1.default)(200, "Engineer escrow items fetched successfully", items));
    }
    catch (error) {
        next(error);
    }
}
async function getEngineerBalanceController(req, res, next) {
    try {
        const balance = await (0, payments_service_1.getEngineerBalance)(req.user.userId);
        res
            .status(200)
            .json((0, ApiResponse_1.default)(200, "Engineer balance fetched successfully", balance));
    }
    catch (error) {
        next(error);
    }
}
/* OLD_WITHDRAWAL_START — Manual withdrawal list controller (commented out for auto-withdrawal via Paymob)
export async function listEngineerWithdrawalsController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const items = await listEngineerWithdrawalRequests(req.user!.userId);
    res
      .status(200)
      .json(ApiResponse(200, "Engineer withdrawals fetched successfully", items));
  } catch (error) {
    next(error);
  }
}

export async function createEngineerWithdrawalController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const input = createWithdrawalRequestSchema.parse(req.body);
    const item = await createEngineerWithdrawalRequest(req.user!.userId, input);
    res
      .status(201)
      .json(ApiResponse(201, "Withdrawal request submitted", item));
  } catch (error) {
    next(error);
  }
}
OLD_WITHDRAWAL_END */
async function listEngineerWithdrawalsController(req, res, next) {
    try {
        const items = await (0, payments_service_1.listEngineerWithdrawalRequests)(req.user.userId);
        res
            .status(200)
            .json((0, ApiResponse_1.default)(200, "Engineer withdrawals fetched successfully", items));
    }
    catch (error) {
        next(error);
    }
}
async function createEngineerAutoWithdrawalController(req, res, next) {
    try {
        const input = payments_validation_1.autoWithdrawalSchema.parse(req.body);
        const item = await (0, payments_service_1.createEngineerAutoWithdrawal)(req.user.userId, input);
        res
            .status(201)
            .json((0, ApiResponse_1.default)(201, "Withdrawal processed via Paymob", item));
    }
    catch (error) {
        next(error);
    }
}
async function releaseEscrowController(req, res, next) {
    try {
        const paymentId = Number(req.params.paymentId);
        const payment = await (0, payments_service_1.releaseEscrowPayment)(req.user.userId, paymentId);
        res
            .status(200)
            .json((0, ApiResponse_1.default)(200, "Escrow released successfully", payment));
    }
    catch (error) {
        next(error);
    }
}
async function getEscrowByIdController(req, res, next) {
    try {
        const paymentId = Number(req.params.paymentId);
        const payment = await (0, payments_service_1.getEscrowPaymentById)(paymentId, req.user.userId);
        res
            .status(200)
            .json((0, ApiResponse_1.default)(200, "Escrow payment fetched successfully", payment));
    }
    catch (error) {
        next(error);
    }
}
async function refundEscrowController(req, res, next) {
    try {
        const paymentId = Number(req.params.paymentId);
        const payment = await (0, payments_service_1.refundEscrowPayment)(req.user.userId, paymentId);
        res
            .status(200)
            .json((0, ApiResponse_1.default)(200, "Escrow refunded successfully", payment));
    }
    catch (error) {
        next(error);
    }
}
async function paymobWebhookController(req, res, next) {
    try {
        const hmac = typeof req.query.hmac === "string" ? req.query.hmac : undefined;
        const result = await (0, payments_service_1.handlePaymobWebhook)(req.body, hmac);
        res.status(200).json((0, ApiResponse_1.default)(200, "Webhook processed", result));
    }
    catch (error) {
        next(error);
    }
}
async function paymobPayoutWebhookController(req, res, next) {
    try {
        const hmac = typeof req.query.hmac === "string" ? req.query.hmac : undefined;
        const { verifyPaymobPayoutHmac, isWebhookReplayed } = await Promise.resolve().then(() => __importStar(require("./paymob.webhook")));
        const { getPaymobPayoutConfig } = await Promise.resolve().then(() => __importStar(require("../../config/paymob")));
        const { metrics } = await Promise.resolve().then(() => __importStar(require("../../utils/metrics")));
        const config = getPaymobPayoutConfig();
        const secrets = [config.hmacSecret, config.hmacSecretPrev].filter(Boolean);
        if (secrets.length > 0 && !verifyPaymobPayoutHmac(req.body, hmac ?? "", secrets)) {
            throw new ApiError_1.default(403, "Invalid payout webhook signature");
        }
        if (isWebhookReplayed(req.body.created_at, 5)) {
            metrics.increment("webhook_replay_blocked");
            throw new ApiError_1.default(403, "Webhook timestamp outside acceptable window (replay protection)");
        }
        const { handlePaymobPayoutWebhook } = await Promise.resolve().then(() => __importStar(require("../payouts/payout.service")));
        const result = await handlePaymobPayoutWebhook(req.body);
        res.status(200).json((0, ApiResponse_1.default)(200, "Payout webhook processed", result));
    }
    catch (error) {
        next(error);
    }
}
async function getPaymentByGatewayController(req, res, next) {
    try {
        const gatewayId = String(req.params.gatewayId);
        const payment = await (0, payments_service_1.getPaymentByGatewayId)(gatewayId, req.user.userId);
        res.status(200).json((0, ApiResponse_1.default)(200, "Payment fetched", payment));
    }
    catch (error) {
        next(error);
    }
}
async function verifyCheckoutReturnController(req, res, next) {
    try {
        const body = payments_validation_1.verifyCheckoutReturnSchema.parse(req.body);
        const cookie = (0, checkoutCookie_1.readCheckoutReturnCookie)(req.cookies[checkoutCookie_1.CHECKOUT_RETURN_COOKIE]);
        const input = {
            ...body,
            projectId: body.projectId ?? cookie?.projectId,
            paymentId: body.paymentId ?? cookie?.paymentId,
        };
        const { verifyCheckoutReturn } = await Promise.resolve().then(() => __importStar(require("./payments.service")));
        const payment = await verifyCheckoutReturn(req.user.userId, input);
        (0, checkoutCookie_1.clearCheckoutReturnCookie)(res, req.headers.origin);
        res
            .status(200)
            .json((0, ApiResponse_1.default)(200, "Payment verified successfully", payment));
    }
    catch (error) {
        next(error);
    }
}
async function verifyPaymentController(req, res, next) {
    try {
        const paymentId = Number(req.params.paymentId);
        const { pollPaymentConfirmation } = await Promise.resolve().then(() => __importStar(require("./payments.service")));
        const payment = await pollPaymentConfirmation(req.user.userId, paymentId);
        res
            .status(200)
            .json((0, ApiResponse_1.default)(200, "Payment status retrieved", payment));
    }
    catch (error) {
        next(error);
    }
}
