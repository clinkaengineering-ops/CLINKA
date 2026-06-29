import { Response, NextFunction, Request } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import ApiResponse from "../../utils/ApiResponse";
import {
  createWithdrawalRequestSchema,
  initiateCheckoutSchema,
} from "./payments.validation";
import {
  createEngineerWithdrawalRequest,
  getEscrowPaymentById,
  getProjectPayment,
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

export async function verifyPaymentController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const paymentId = Number(req.params.paymentId);
    const { verifyOrSimulatePaymentSuccess } = await import("./payments.service");
    const payment = await verifyOrSimulatePaymentSuccess(req.user!.userId, paymentId);
    res
      .status(200)
      .json(ApiResponse(200, "Payment verified successfully", payment));
  } catch (error) {
    next(error);
  }
}
