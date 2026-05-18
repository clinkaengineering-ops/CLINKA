import { AuthRequest } from "../../middlewares/auth.middleware";
import {Request, NextFunction, Response } from "express";
import { createBidSchema } from "./bids.validation";
import { approveBid, createBid, getBidsForProject } from "./bids.service";
import ApiResponse from "../../utils/ApiResponse";
export async function createBidController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const validatedData = createBidSchema.parse(req.body);
    const projectId = Number(req.params.projectId);
    const bid = await createBid(req.user!.userId,projectId , validatedData);
    res.status(201).json(ApiResponse(201, "Bid created successfully", bid));
  } catch (error) {
    next(error);
  }
}

export async function getBidsForProjectController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const projectId = Number(req.params.projectId);
    const bids = await getBidsForProject(projectId);
    res.status(200).json(ApiResponse(200, "Bids fetched successfully", bids));
  } catch (error) {
    next(error);
  }
}

export async function approveBidController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const bidId = Number(req.params.bidId);
    const bid = await approveBid(req.user!.userId, bidId);
    res.status(200).json(ApiResponse(200, "Bid approved successfully", bid));
  } catch (error) {
    next(error);
  }
}