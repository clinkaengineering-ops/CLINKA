import { Request, Response, NextFunction } from "express";
import ApiResponse from "../../utils/ApiResponse";
import { getLandingSnapshot } from "./public.service";

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
