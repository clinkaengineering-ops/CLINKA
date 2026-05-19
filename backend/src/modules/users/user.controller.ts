// backend/features/users/user.controller.ts
import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../../middlewares/auth.middleware";
import { addPortfolioItemSchema, updateProfileSchema } from "./user.validation";
import ApiResponse from "../../utils/ApiResponse";
import {
  addPortfolioItem,
  deletePortfolioItem,
  getEngineerById,
  getEngineers,
  getMe,
  updateMe,
} from "./user.service";

export async function getMeController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const user = await getMe(req.user!.userId);
    res.status(200).json(ApiResponse(200, "User fetched successfully", user));
  } catch (error) {
    next(error);
  }
}

export async function updateMeController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const validatedData = updateProfileSchema.parse(req.body);
    const user = await updateMe(req.user!.userId, validatedData);
    res.status(200).json(ApiResponse(200, "User updated successfully", user));
  } catch (error) {
    next(error);
  }
}

export async function getEngineersController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const engineers = await getEngineers();
    res
      .status(200)
      .json(ApiResponse(200, "Engineers fetched successfully", engineers));
  } catch (error) {
    next(error);
  }
}

export async function getEngineerByIdController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const engineer = await getEngineerById(Number(req.params.id));
    res
      .status(200)
      .json(ApiResponse(200, "Engineer fetched successfully", engineer));
  } catch (error) {
    next(error);
  }
}

export async function addPortfolioItemController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const validatedData = addPortfolioItemSchema.parse(req.body);
    const item = await addPortfolioItem(req.user!.userId, validatedData);
    res
      .status(201)
      .json(ApiResponse(201, "Portfolio item added successfully", item));
  } catch (error) {
    next(error);
  }
}

export async function deletePortfolioItemController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    await deletePortfolioItem(req.user!.userId, Number(req.params.id));
    res
      .status(200)
      .json(ApiResponse(200, "Portfolio item deleted successfully"));
  } catch (error) {
    next(error);
  }
}
