import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import { formatZodError } from "../utils/zodErrors";
import { resolveUploadError } from "../utils/uploadErrors";

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json(ApiResponse(err.statusCode, err.message));
    return;
  }

  if (err instanceof ZodError) {
    const { message, errors } = formatZodError(err);
    res.status(400).json({
      ...ApiResponse(400, message, { errors }),
      errors,
    });
    return;
  }

  const uploadErr = resolveUploadError(err);
  if (uploadErr) {
    res
      .status(uploadErr.statusCode)
      .json(ApiResponse(uploadErr.statusCode, uploadErr.message));
    return;
  }

  // Unknown error
  console.error(err);
  res.status(500).json(ApiResponse(500, "Internal server error"));
}