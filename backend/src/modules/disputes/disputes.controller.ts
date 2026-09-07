import { Request as ExpressRequest, Response } from "express";

interface Request extends ExpressRequest {
  user?: { userId: string; role: string; email: string };
}
import { openDispute, resolveDispute, escalateDispute, manualFreeze } from "./disputes.service";
import ApiError from "../../utils/ApiError";
import ApiResponse from "../../utils/ApiResponse";

export async function openDisputeController(req: Request, res: Response) {
  const { projectId, reason } = req.body;
  if (!projectId || !reason) throw new ApiError(400, "Missing required fields");

  const dispute = await openDispute(String(req.user!.userId), String(projectId), reason);
  res.status(201).json(ApiResponse(201, "Dispute opened successfully", dispute));
}

export async function resolveDisputeController(req: Request, res: Response) {
  const { projectId, resolution, reason } = req.body;
  if (!projectId || !resolution || !reason) throw new ApiError(400, "Missing required fields");
  if (resolution !== "ENGINEER" && resolution !== "CLIENT") throw new ApiError(400, "Invalid resolution");

  const dispute = await resolveDispute(String(req.user!.userId), String(projectId), resolution, reason);
  res.status(200).json(ApiResponse(200, "Dispute resolved successfully", dispute));
}

export async function escalateDisputeController(req: Request, res: Response) {
  const { projectId } = req.body;
  if (!projectId) throw new ApiError(400, "Missing required fields");

  const dispute = await escalateDispute(String(req.user!.userId), req.user!.role, String(projectId));
  res.status(200).json(ApiResponse(200, "Dispute escalated successfully", dispute));
}

export async function manualFreezeController(req: Request, res: Response) {
  const { engineerId, amount, reason } = req.body;
  if (!engineerId || !amount || !reason) throw new ApiError(400, "Missing required fields");

  const result = await manualFreeze(String(req.user!.userId), Number(engineerId), Number(amount), reason);
  res.status(200).json(ApiResponse(200, "Balance frozen successfully", result));
}
