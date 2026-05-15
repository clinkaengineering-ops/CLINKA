import { Request, Response, NextFunction } from "express";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json(ApiResponse(err.statusCode, err.message));
    return;
  }

  // Zod validation error
  if (err instanceof Error && err.name === "ZodError") {
    res.status(400).json(ApiResponse(400, err.message));
    return;
  }

  // Unknown error
  console.error(err);
  res.status(500).json(ApiResponse(500, "Internal server error"));
}