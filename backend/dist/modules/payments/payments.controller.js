"use strict";
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
exports.releaseEscrowController = releaseEscrowController;
exports.getEscrowByIdController = getEscrowByIdController;
exports.refundEscrowController = refundEscrowController;
exports.fawaterkWebhookController = fawaterkWebhookController;
const ApiResponse_1 = __importDefault(require("../../utils/ApiResponse"));
const payments_validation_1 = require("./payments.validation");
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
async function fawaterkWebhookController(req, res, next) {
    try {
        const result = await (0, payments_service_1.handleFawaterkWebhook)(req.body);
        res.status(200).json((0, ApiResponse_1.default)(200, "Webhook processed", result));
    }
    catch (error) {
        next(error);
    }
}
