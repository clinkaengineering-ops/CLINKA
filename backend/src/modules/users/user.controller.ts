// backend/features/users/user.controller.ts
import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../../middlewares/auth.middleware";
import {
  addPortfolioItemSchema,
  searchQuerySchema,
  updateProfileSchema,
} from "./user.validation";
import ApiResponse from "../../utils/ApiResponse";
import {
  addPortfolioItem,
  deletePortfolioItem,
  getEngineerById,
  getEngineers,
  getMe,
  updateAvatar,
  updateCoverImage,
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
    const { q, specialty, nationality } = searchQuerySchema.parse(req.query);
    const engineers = await getEngineers({ q, specialty, nationality });
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
    const imageUrl =
      (req.file as Express.Multer.File | undefined)?.path ?? req.body.imageUrl;
    const description = String(req.body.description ?? "").trim();
    const validatedData = addPortfolioItemSchema.parse({ imageUrl, description });
    const item = await addPortfolioItem(req.user!.userId, validatedData);
    res
      .status(201)
      .json(ApiResponse(201, "Portfolio item added successfully", item));
  } catch (error) {
    next(error);
  }
}

export async function uploadAvatarController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const imageUrl = (req.file as Express.Multer.File | undefined)?.path;
    if (!imageUrl) throw new Error("No image uploaded");
    const user = await updateAvatar(req.user!.userId, imageUrl);
    res.status(200).json(ApiResponse(200, "Avatar updated", user));
  } catch (error) {
    next(error);
  }
}

export async function uploadCoverController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const imageUrl = (req.file as Express.Multer.File | undefined)?.path;
    if (!imageUrl) throw new Error("No image uploaded");
    const user = await updateCoverImage(req.user!.userId, imageUrl);
    res.status(200).json(ApiResponse(200, "Cover updated", user));
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
