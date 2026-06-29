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
  resumeEngineerRegistration,
  checkRegistrationEmail,
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
import { oauthSessionSchema, verifyOtpSchema } from "./auth.validation";
import jwt from "jsonwebtoken";
import { getMe } from "../users/user.service";
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

export async function checkRegistrationEmailController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const email = typeof req.query.email === "string" ? req.query.email : "";
    if (!email.trim()) {
      throw new ApiError(400, "Email is required");
    }
    const result = await checkRegistrationEmail(email);
    res.status(200).json(ApiResponse(200, "Registration status checked", result));
  } catch (error) {
    next(error);
  }
}

export async function registerClientController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const validatedData = clientRegisterSchema.parse(req.body);
    const user = await registerClient(validatedData);
    res
      .status(201)
      .json(ApiResponse(201, "Check your email to verify your account", user));
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
    const files = req.files as
      | {
          document?: { path: string }[];
          portfolio?: { path: string }[];
        }
      | undefined;
    const documentFile = files?.document?.[0] ?? req.file;
    const fileUrl = documentFile?.path ?? "";
    const documentType = req.body.documentType as
      | "collegeIdUrl"
      | "certificateUrl"
      | "syndicateCardUrl";
    const portfolioUrls = (files?.portfolio ?? []).map((file) => file.path);
    const user = await registerEngineer(
      validatedData,
      fileUrl,
      documentType,
      portfolioUrls,
    );
    res
      .status(201)
      .json(ApiResponse(201, "Check your email to verify your account", user));
  } catch (error) {
    next(error);
  }
}

export async function resumeEngineerRegistrationController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const validatedData = clientRegisterSchema.parse(req.body);
    const files = req.files as { portfolio?: { path: string }[] } | undefined;
    const portfolioUrls = (files?.portfolio ?? []).map((file) => file.path);
    const user = await resumeEngineerRegistration(
      validatedData,
      portfolioUrls,
    );
    res
      .status(200)
      .json(ApiResponse(200, "Check your email to verify your account", user));
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
    const { token: sessionToken, userId } = await verifyEmail(token);
    const user = await getMe(userId);
    res.cookie("token", sessionToken, authCookieOptions(req.headers.origin));
    res.status(200).json(ApiResponse(200, "Email verified successfully", user));
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
    res.clearCookie("token", authCookieOptions(req.headers.origin));
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

    res.cookie("token", result.token, authCookieOptions(req.headers.origin));

    res.status(200).json(ApiResponse(200, "Logged in successfully", result.user));
  } catch (error) {
    next(error);
  }
}

/** Exchange a short-lived OAuth session JWT for an httpOnly cookie on the frontend origin. */
export async function oauthSessionController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { session } = oauthSessionSchema.parse(req.body);
    let payload: { userId: number; role: string };
    try {
      payload = jwt.verify(session, process.env.JWT_SECRET as string) as {
        userId: number;
        role: string;
      };
    } catch {
      throw new ApiError(401, "Invalid or expired session");
    }

    res.cookie("token", session, authCookieOptions(req.headers.origin));
    const user = await getMe(payload.userId);
    res.status(200).json(ApiResponse(200, "Signed in successfully", user));
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
    const apiOrigin =
      typeof req.query.api_origin === "string" ? req.query.api_origin : undefined;
    const clientOrigin =
      typeof req.query.client_origin === "string"
        ? req.query.client_origin
        : undefined;
    const url = getGoogleAuthRedirectUrl({ next, role, apiOrigin, clientOrigin });
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
      res.cookie(
        "token",
        result.token,
        authCookieOptions(result.clientOrigin ?? req.headers.origin),
      );
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