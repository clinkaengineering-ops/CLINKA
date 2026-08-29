import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError";
import {
  bannedUserMessage,
  isUserBanned,
} from "../modules/messages/ban.service";

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

/** Sets req.user when a valid token is present; does not fail when absent. */
export function optionalAuthenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const token = extractToken(req);
  if (!token) {
    next();
    return;
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: number;
      role: string;
    };
    req.user = payload;
    next();
  } catch {
    next();
  }
}

/** Block suspended users. Optionally limit to specific roles. */
export function rejectIfBanned(...roles: string[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      next();
      return;
    }
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      next();
      return;
    }
    try {
      const banStatus = await isUserBanned(req.user.userId);
      if (banStatus.banned) {
        const action =
          req.user.role === "ENGINEER"
            ? "use engineer features while suspended"
            : "use this feature while suspended";
        next(
          new ApiError(
            403,
            bannedUserMessage(banStatus.expiresAt, action),
          ),
        );
        return;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}