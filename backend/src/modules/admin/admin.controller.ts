import { NextFunction, Request, Response } from "express";
import ApiResponse from "../../utils/ApiResponse";
import { updateVerificationSchema } from "./admin.validation";
import {
  getAdminStats,
  getPendingVerifications,
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
