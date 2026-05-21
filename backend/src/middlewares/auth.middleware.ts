import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError";

export interface AuthRequest extends Request {
  user?: { userId: number; role: string };
}

function extractToken(req: Request): string | undefined {
  const cookieToken = req.cookies?.token;
  if (cookieToken) return cookieToken;

  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7).trim();
  return undefined;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token = extractToken(req);
    if (!token) throw new ApiError(401, "Not authenticated");

    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: number; role: string };
    req.user = payload;

    next();
  } catch (error) {
    next(new ApiError(401, "Invalid or expired token"));
  }
}

export function authorize(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, "You don't have permission to do this"));
    }
    next();
  };
}