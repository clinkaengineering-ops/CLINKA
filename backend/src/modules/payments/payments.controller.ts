import { Response, NextFunction, Request } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import ApiResponse from "../../utils/ApiResponse";
import ApiError from "../../utils/ApiError";
import {
  // createWithdrawalRequestSchema, // OLD_WITHDRAWAL: commented out for auto-withdrawal
  autoWithdrawalSchema,
  initiateCheckoutSchema,
  verifyCheckoutReturnSchema,
} from "./payments.validation";
import {
  clearCheckoutReturnCookie,
  readCheckoutReturnCookie,
  setCheckoutReturnCookie,
  CHECKOUT_RETURN_COOKIE,
} from "../../config/checkoutCookie";
import {
  createWithdrawalRequest,
  // createEngineerWithdrawalRequest, // OLD_WITHDRAWAL: commented out for auto-withdrawal
  getEscrowPaymentById,
  getProjectPayment,
  getPaymentByGatewayId,
  handlePaymobWebhook,
  initiateProjectCheckout,
  prepareProjectCheckoutSession,
  getEngineerBalance,
  listEngineerWithdrawalRequests,
  listClientEscrow,
  listEngineerEscrow,
  listPaymentMethods,
  refundEscrowPayment,
  releaseEscrowPayment,
} from "./payments.service";

export async function getPaymentMethodsController(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const methods = await listPaymentMethods();
    res
      .status(200)
      .json(ApiResponse(200, "Payment methods fetched successfully", methods));
  } catch (error) {
    next(error);
  }
}

export async function getCheckoutSessionController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const projectId = Number(req.params.projectId);
    const phone =
      typeof req.query.phone === "string" ? req.query.phone : undefined;
    const address =
      typeof req.query.address === "string" ? req.query.address : undefined;
    const session = await prepareProjectCheckoutSession(
      req.user!.userId,
      projectId,
      phone,
      address,
    );
    setCheckoutReturnCookie(
      res,
      { projectId: session.projectId, paymentId: session.paymentId },
      req.headers.origin,
    );
    res.status(200).json(ApiResponse(200, "Checkout session ready", session));
  } catch (error) {
    next(error);
  }
}

export async function initiateCheckoutController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const projectId = Number(req.params.projectId);
    const input = initiateCheckoutSchema.parse(req.body);
    const result = await initiateProjectCheckout(
      req.user!.userId,
      projectId,
      input,
    );
    setCheckoutReturnCookie(
      res,
      { projectId, paymentId: result.payment.id },
      req.headers.origin,
    );
    res
      .status(200)
      .json(ApiResponse(200, "Payment session created successfully", result));
  } catch (error) {
    next(error);
  }
}

export async function getProjectPaymentController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const projectId = Number(req.params.projectId);
    const payment = await getProjectPayment(projectId, req.user!.userId);
    res
      .status(200)
      .json(ApiResponse(200, "Payment fetched successfully", payment));
  } catch (error) {
    next(error);
  }
}

export async function listEscrowController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const items = await listClientEscrow(req.user!.userId);
    res
      .status(200)
      .json(ApiResponse(200, "Escrow items fetched successfully", items));
  } catch (error) {
    next(error);
  }
}

export async function listEngineerEscrowController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const items = await listEngineerEscrow(req.user!.userId);
    res
      .status(200)
      .json(
        ApiResponse(200, "Engineer escrow items fetched successfully", items),
      );
  } catch (error) {
    next(error);
  }
}

export async function getEngineerBalanceController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const balance = await getEngineerBalance(req.user!.userId);
    res
      .status(200)
      .json(ApiResponse(200, "Engineer balance fetched successfully", balance));
  } catch (error) {
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
    const idempotencyKey =
      typeof req.headers["idempotency-key"] === "string"
        ? req.headers["idempotency-key"].trim()
        : undefined;

    if (!idempotencyKey) {
      throw new ApiError(400, "Idempotency-Key header is required");
    }

    const { payoutMethod } = req.body;
    let input;
    
    if (payoutMethod === "IBAN") {
      const { internationalWithdrawalSchema } = await import("./payments.validation");
      input = internationalWithdrawalSchema.parse(req.body);
    } else if (payoutMethod === "PAYMOB") {
      input = autoWithdrawalSchema.parse(req.body);
    } else {
      throw new ApiError(400, "Invalid or missing payoutMethod");
    }

    const item = await createWithdrawalRequest(req.user!.userId, payoutMethod as "PAYMOB" | "IBAN", input, idempotencyKey);
    const { sanitizeWithdrawalForEngineer } = await import("../payouts/payout.presenter");
    res
      .status(201)
      .json(ApiResponse(201, "Withdrawal request processed", sanitizeWithdrawalForEngineer(item)));
  } catch (error) {
    next(error);
  }
}

export async function releaseEscrowController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const paymentId = Number(req.params.paymentId);
    const payment = await releaseEscrowPayment(req.user!.userId, paymentId);
    res
      .status(200)
      .json(ApiResponse(200, "Escrow released successfully", payment));
  } catch (error) {
    next(error);
  }
}

export async function getEscrowByIdController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const paymentId = Number(req.params.paymentId);
    const payment = await getEscrowPaymentById(paymentId, req.user!.userId);
    res
      .status(200)
      .json(ApiResponse(200, "Escrow payment fetched successfully", payment));
  } catch (error) {
    next(error);
  }
}

export async function refundEscrowController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const paymentId = Number(req.params.paymentId);
    const payment = await refundEscrowPayment(req.user!.userId, paymentId);
    res
      .status(200)
      .json(ApiResponse(200, "Escrow refunded successfully", payment));
  } catch (error) {
    next(error);
  }
}

export async function paymobWebhookController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const hmac =
      typeof req.query.hmac === "string" ? req.query.hmac : undefined;
    const result = await handlePaymobWebhook(req.body, hmac);
    res.status(200).json(ApiResponse(200, "Webhook processed", result));
  } catch (error) {
    next(error);
  }
}

export async function paymobPayoutWebhookController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const hmac = typeof req.query.hmac === "string" ? req.query.hmac : undefined;
    const { verifyPaymobPayoutHmac, isWebhookReplayed } = await import("./paymob.webhook");
    const { getPaymobPayoutConfig } = await import("../../config/paymob");
    const { metrics } = await import("../../utils/metrics");
    
    const config = getPaymobPayoutConfig();
    const secrets = [config.hmacSecret, config.hmacSecretPrev].filter(Boolean) as string[];
    
    if (secrets.length > 0 && !verifyPaymobPayoutHmac(req.body, hmac ?? "", secrets)) {
      throw new ApiError(403, "Invalid payout webhook signature");
    }

    if (isWebhookReplayed(req.body.created_at, 5)) {
      metrics.increment("webhook_replay_blocked");
      throw new ApiError(403, "Webhook timestamp outside acceptable window (replay protection)");
    }

    const { handlePaymobPayoutWebhook } = await import("../payouts/payout.service");
    const result = await handlePaymobPayoutWebhook(req.body);
    res.status(200).json(ApiResponse(200, "Payout webhook processed", result));
  } catch (error) {
    next(error);
  }
}

export async function getPaymentByGatewayController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const gatewayId = String(req.params.gatewayId);
    const payment = await getPaymentByGatewayId(gatewayId, req.user!.userId);
    res.status(200).json(ApiResponse(200, "Payment fetched", payment));
  } catch (error) {
    next(error);
  }
}

export async function verifyCheckoutReturnController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const body = verifyCheckoutReturnSchema.parse(req.body);
    const cookie = readCheckoutReturnCookie(req.cookies[CHECKOUT_RETURN_COOKIE]);
    const input = {
      ...body,
      projectId: body.projectId ?? cookie?.projectId,
      paymentId: body.paymentId ?? cookie?.paymentId,
    };
    const { verifyCheckoutReturn } = await import("./payments.service");
    const payment = await verifyCheckoutReturn(req.user!.userId, input);
    clearCheckoutReturnCookie(res, req.headers.origin);
    res
      .status(200)
      .json(ApiResponse(200, "Payment verified successfully", payment));
  } catch (error) {
    next(error);
  }
}

export async function verifyPaymentController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const paymentId = Number(req.params.paymentId);
    const { pollPaymentConfirmation } = await import("./payments.service");
    const payment = await pollPaymentConfirmation(req.user!.userId, paymentId);
    res
      .status(200)
      .json(ApiResponse(200, "Payment status retrieved", payment));
  } catch (error) {
    next(error);
  }
}
