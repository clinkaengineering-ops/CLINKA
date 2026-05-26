import { Request, Response, NextFunction } from "express";
import {
  changePasswordSchema,
  confirmEmailChangeSchema,
  requestEmailChangeSchema,
  clientRegisterSchema,
  engineerRegisterSchema,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
} from "./auth.validation";
import {
  registerClient,
  registerEngineer,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  resendVerificationEmail,
  changePassword,
  confirmEmailChange,
  requestEmailChange,
  verifyOtp,
} from "./auth.service";
import { verifyOtpSchema } from "./auth.validation";
import ApiResponse from "../../utils/ApiResponse";
import ApiError from "../../utils/ApiError";
import { authCookieOptions } from "../../config/cookies";
import multer from "multer";
import { AuthRequest } from "../../middlewares/auth.middleware";
import {
  getGoogleAuthRedirectUrl,
  handleGoogleCallback,
} from "./google.service";
import { isGoogleAuthEnabled } from "../../config/google";

export async function registerClientController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const validatedData = clientRegisterSchema.parse(req.body);
    const user = await registerClient(validatedData);
    res.status(201).json(ApiResponse(201, "Registered successfully", user));
  } catch (error) {
    next(error);
  }
}

export async function registerEngineerController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const validatedData = engineerRegisterSchema.parse(req.body);
    const fileUrl = req.file?.path ?? "";
    const documentType = req.body.documentType as
      | "collegeIdUrl"
      | "certificateUrl"
      | "syndicateCardUrl";
    const user = await registerEngineer(validatedData, fileUrl, documentType);
    res.status(201).json(ApiResponse(201, "Registered successfully", user));
  } catch (error) {
    next(error);
  }
}

export async function loginController(req: Request, res: Response, next: NextFunction) {
  try {
    const validatedData = loginSchema.parse(req.body);
    const result = await login(validatedData);
    res.status(200).json(ApiResponse(200, result.message, { userId: result.userId }));
  } catch (error) {
    next(error);
  }
}

export async function verifyEmailController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { token } = req.query as { token: string };
    await verifyEmail(token);
    res.status(200).json(ApiResponse(200, "Email verified successfully"));
  } catch (error) {
    next(error);
  }
}

export async function forgotPasswordController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    await forgotPassword(email);
    res.status(200).json(ApiResponse(200, "Reset link sent to your email"));
  } catch (error) {
    next(error);
  }
}

export async function resetPasswordController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { token, newPassword } = resetPasswordSchema.parse(req.body);
    await resetPassword(token, newPassword);
    res.status(200).json(ApiResponse(200, "Password reset successfully"));
  } catch (error) {
    next(error);
  }
}

export async function logoutController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    res.clearCookie("token", authCookieOptions());
    res.status(200).json(ApiResponse(200, "Logged out successfully"));
  } catch (error) {
    next(error);
  }
}

export async function resendVerificationController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    await resendVerificationEmail(req.user!.userId, req.body.email);
    res.status(200).json(ApiResponse(200, "Verification email resent"));
  } catch (error) {
    next(error);
  }
}

export async function changePasswordController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const { oldPassword, newPassword } = changePasswordSchema.parse(req.body);
    await changePassword(req.user!.userId, oldPassword, newPassword);
    res.status(200).json(ApiResponse(200, "Password changed successfully"));
  } catch (error) {
    next(error);
  }
}

export async function requestEmailChangeController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const { newEmail } = requestEmailChangeSchema.parse(req.body);
    const result = await requestEmailChange(req.user!.userId, newEmail);
    res.status(200).json(ApiResponse(200, result.message, null));
  } catch (error) {
    next(error);
  }
}

export async function confirmEmailChangeController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const { otp } = confirmEmailChangeSchema.parse(req.body);
    const user = await confirmEmailChange(req.user!.userId, otp);
    res.status(200).json(ApiResponse(200, "Email updated successfully", user));
  } catch (error) {
    next(error);
  }
}



export async function verifyOtpController(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, otp } = verifyOtpSchema.parse(req.body);
    const result = await verifyOtp(userId, otp);

    res.cookie("token", result.token, authCookieOptions());

    res.status(200).json(ApiResponse(200, "Logged in successfully", result.user));
  } catch (error) {
    next(error);
  }
}

export async function googleAuthStartController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!isGoogleAuthEnabled()) {
      throw new ApiError(503, "Google sign-in is not configured");
    }
    const next =
      typeof req.query.next === "string" ? req.query.next : undefined;
    const role =
      req.query.role === "ENGINEER" ? ("ENGINEER" as const) : ("CLIENT" as const);
    const url = getGoogleAuthRedirectUrl({ next, role });
    res.redirect(url);
  } catch (error) {
    next(error);
  }
}

export async function googleAuthCallbackController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const code = typeof req.query.code === "string" ? req.query.code : undefined;
    const state = typeof req.query.state === "string" ? req.query.state : undefined;
    const error =
      typeof req.query.error === "string" ? req.query.error : undefined;

    const result = await handleGoogleCallback(code, state, error);

    if (result.token) {
      res.cookie("token", result.token, authCookieOptions());
    }

    res.redirect(result.redirectUrl);
  } catch (error) {
    next(error);
  }
}

export async function googleAuthStatusController(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    res.status(200).json(
      ApiResponse(200, "OK", { enabled: isGoogleAuthEnabled() }),
    );
  } catch (error) {
    next(error);
  }
}