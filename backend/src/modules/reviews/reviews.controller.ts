import { NextFunction, Request, Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import ApiResponse from "../../utils/ApiResponse";
import { createReviewSchema } from "./reviews.validation";
import {
  canReviewProject,
  createProjectReview,
  getEngineerReviews,
  getProjectReview,
  listMyReviews,
  listPendingReviews,
} from "./reviews.service";

export async function createReviewController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const projectId = Number(req.params.projectId);
    const input = createReviewSchema.parse(req.body);
    const review = await createProjectReview(
      req.user!.userId,
      projectId,
      input,
    );
    res.status(201).json(ApiResponse(201, "Review submitted successfully", review));
  } catch (error) {
    next(error);
  }
}

export async function getProjectReviewController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const review = await getProjectReview(Number(req.params.projectId));
    res.status(200).json(ApiResponse(200, "Review fetched successfully", review));
  } catch (error) {
    next(error);
  }
}

export async function getEngineerReviewsController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const reviews = await getEngineerReviews(Number(req.params.engineerId));
    res
      .status(200)
      .json(ApiResponse(200, "Engineer reviews fetched successfully", reviews));
  } catch (error) {
    next(error);
  }
}

export async function listPendingReviewsController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const pending = await listPendingReviews(req.user!.userId);
    res
      .status(200)
      .json(ApiResponse(200, "Pending reviews fetched successfully", pending));
  } catch (error) {
    next(error);
  }
}

export async function listMyReviewsController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const reviews = await listMyReviews(req.user!.userId);
    res.status(200).json(ApiResponse(200, "Your reviews fetched successfully", reviews));
  } catch (error) {
    next(error);
  }
}

export async function canReviewProjectController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await canReviewProject(
      req.user!.userId,
      Number(req.params.projectId),
    );
    res.status(200).json(ApiResponse(200, "Review eligibility checked", result));
  } catch (error) {
    next(error);
  }
}
