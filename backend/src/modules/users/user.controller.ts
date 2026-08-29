// backend/features/users/user.controller.ts
import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../../middlewares/auth.middleware";
import {
  addPortfolioItemSchema,
  searchQuerySchema,
  updateProfileSchema,
} from "./user.validation";
import { getRelativeUploadUrl } from "../../config/localUpload";
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
    const query = searchQuerySchema.parse(req.query);
    const result = await getEngineers(query);
    res
      .status(200)
      .json(ApiResponse(200, "Engineers fetched successfully", result));
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
    const engineer = await getEngineerById(String(req.params.id));
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
    const uploadedUrl = getRelativeUploadUrl(req.file as Express.Multer.File);
    if (uploadedUrl && !req.body.coverImageUrl) {
      req.body.coverImageUrl = uploadedUrl;
    }
    
    // SkillIds might come as string from form-data
    if (typeof req.body.skillIds === 'string') {
      req.body.skillIds = req.body.skillIds.split(',').map(Number);
    }
    if (typeof req.body.files === 'string') {
      req.body.files = JSON.parse(req.body.files);
    }

    const validatedData = addPortfolioItemSchema.parse(req.body);
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
    const imageUrl = getRelativeUploadUrl(req.file as Express.Multer.File);
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
    const imageUrl = getRelativeUploadUrl(req.file as Express.Multer.File);
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
