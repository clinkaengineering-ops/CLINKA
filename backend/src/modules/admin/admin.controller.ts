import { NextFunction, Request, Response } from "express";
import ApiResponse from "../../utils/ApiResponse";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { banUserSchema, updateVerificationSchema } from "./admin.validation";
import {
  banUserManually,
  getAdminStats,
  getAllBans,
  getAllConversations,
  getConversationMessages,
  getPendingVerifications,
  lookupUser,
  unbanUser,
  updateEngineerVerification,
} from "./admin.service";

export async function getAdminStatsController(
  _req: unknown,
  res: Response,
  next: NextFunction,
) {
  try {
    const stats = await getAdminStats();
    res.status(200).json(ApiResponse(200, "Admin stats fetched", stats));
  } catch (error) {
    next(error);
  }
}

export async function getPendingVerificationsController(
  _req: unknown,
  res: Response,
  next: NextFunction,
) {
  try {
    const list = await getPendingVerifications();
    res
      .status(200)
      .json(ApiResponse(200, "Pending verifications fetched", list));
  } catch (error) {
    next(error);
  }
}

export async function updateVerificationController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const input = updateVerificationSchema.parse(req.body);
    const user = await updateEngineerVerification(
      Number(req.params.profileId),
      input,
    );
    res.status(200).json(ApiResponse(200, "Verification updated", user));
  } catch (error) {
    next(error);
  }
}

export async function getAllBansController(
  _req: unknown,
  res: Response,
  next: NextFunction,
) {
  try {
    const bans = await getAllBans();
    res.status(200).json(ApiResponse(200, "Bans fetched", bans));
  } catch (error) {
    next(error);
  }
}

export async function banUserController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const input = banUserSchema.parse(req.body);
    const result = await banUserManually(
      req.user!.userId,
      Number(req.params.userId),
      input.note,
    );
    res.status(201).json(ApiResponse(201, "User banned for 30 days", result));
  } catch (error) {
    next(error);
  }
}

export async function unbanUserController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await unbanUser(req.user!.userId, Number(req.params.userId));
    res.status(200).json(ApiResponse(200, "User unbanned", result));
  } catch (error) {
    next(error);
  }
}

export async function lookupUserController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const identifier = String(req.query.identifier ?? "");
    if (!identifier.trim()) {
      res.status(400).json(ApiResponse(400, "identifier query is required"));
      return;
    }
    const user = await lookupUser(identifier);
    res.status(200).json(ApiResponse(200, "User found", user));
  } catch (error) {
    next(error);
  }
}

export async function getAllConversationsController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const data = await getAllConversations(page, limit);
    res.status(200).json(ApiResponse(200, "Conversations fetched", data));
  } catch (error) {
    next(error);
  }
}

export async function getConversationMessagesController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const conversationId = Number(req.params.conversationId);
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const data = await getConversationMessages(conversationId, page, limit);
    res.status(200).json(ApiResponse(200, "Messages fetched", data));
  } catch (error) {
    next(error);
  }
}
