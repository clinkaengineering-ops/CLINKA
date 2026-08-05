import { Request, Response, NextFunction } from "express";
import ApiResponse from "../../utils/ApiResponse";
import { AuthRequest } from "../../middlewares/auth.middleware";
import {
  createSupportTicket,
  getLandingSnapshot,
  getSupportContactEmail,
  getPublicConfig,
} from "./public.service";
import { createSupportTicketSchema } from "./public.validation";

export async function getPublicConfigController(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await getPublicConfig();
    res.status(200).json(ApiResponse(200, "Public config fetched", data));
  } catch (error) {
    next(error);
  }
}

export async function getLandingSnapshotController(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await getLandingSnapshot();
    res.status(200).json(ApiResponse(200, "Landing snapshot fetched", data));
  } catch (error) {
    next(error);
  }
}

export async function getSupportContactController(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    res.status(200).json(
      ApiResponse(200, "Support contact fetched", {
        email: getSupportContactEmail(),
      }),
    );
  } catch (error) {
    next(error);
  }
}

export async function createSupportTicketController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const input = createSupportTicketSchema.parse(req.body);
    const ticket = await createSupportTicket(input, req.user?.userId);
    res
      .status(201)
      .json(ApiResponse(201, "Support request submitted", { id: ticket.id }));
  } catch (error) {
    next(error);
  }
}
