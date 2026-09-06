import { Request, Response, NextFunction } from "express";
import {
  changePasswordSchema,
  confirmEmailChangeSchema,
  requestEmailChangeSchema,
  clientRegisterSchema,
  clientApplyEngineerSchema,
  engineerRegisterSchema,
  forgotPasswordSchema,
  googleCompleteRegistrationSchema,
  loginSchema,
  resetPasswordSchema,
} from "./auth.validation";
import {
  registerClient,
  registerEngineer,
  applyClientAsEngineer,
  resumeEngineerRegistration,
  completeGoogleEngineerRegistration,
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
import { verifyOtpSchema } from "./auth.validation";
import ApiResponse from "../../utils/ApiResponse";
import ApiError from "../../utils/ApiError";
import { authCookieOptions } from "../../config/cookies";
import { getStoredUploadPath } from "../../config/upload";
import { AuthRequest } from "../../middlewares/auth.middleware";
import {
  getGoogleAuthRedirectUrl,
  handleGoogleCallback,
  completeGoogleRegistration,
} from "./google.service";
import { isGoogleAuthEnabled } from "../../config/google";
import { logSystemEvent } from "../../utils/auditLogger";
import {
  requireEngineerDocumentType,
  requireVerificationDocumentUrl,
} from "./engineerVerification";

function mapUploadedPaths(
  files: Express.Multer.File[] | undefined,
  category: "documents" | "images",
): string[] {
  return (files ?? [])
    .map((file) => getStoredUploadPath(file, category)!)
    .filter((url) => url.trim().length > 0);
}

function uploadedDocumentUrl(req: Request): string {
  const files = req.files as
    | { document?: Express.Multer.File[] }
    | undefined;
  const documentFile = files?.document?.[0] ?? req.file;
  if (documentFile && "size" in documentFile && documentFile.size === 0) {
    throw new ApiError(400, "Verification document is required");
  }
  const fileUrl = documentFile
    ? getStoredUploadPath(documentFile as Express.Multer.File, "documents") ?? ""
    : "";
  return requireVerificationDocumentUrl(fileUrl);
}

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
    const documentType = requireEngineerDocumentType(validatedData.documentType);
    const portfolioUrls = mapUploadedPaths(
      files?.portfolio as Express.Multer.File[] | undefined,
      "images",
    );
    const user = await registerEngineer(
      validatedData,
      uploadedDocumentUrl(req),
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
    const portfolioUrls = mapUploadedPaths(
      files?.portfolio as Express.Multer.File[] | undefined,
      "images",
    );
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

export async function applyClientAsEngineerController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const validatedData = clientApplyEngineerSchema.parse(req.body);
    const files = req.files as
      | {
          document?: { path: string }[];
          portfolio?: { path: string }[];
        }
      | undefined;
    const documentType = requireEngineerDocumentType(validatedData.documentType);
    const portfolioUrls = mapUploadedPaths(
      files?.portfolio as Express.Multer.File[] | undefined,
      "images",
    );
    const user = await applyClientAsEngineer(
      req.user!.userId,
      validatedData,
      uploadedDocumentUrl(req),
      documentType,
      portfolioUrls,
    );
    res
      .status(200)
      .json(ApiResponse(200, "Engineer application submitted", user));
  } catch (error) {
    next(error);
  }
}

export async function completeGoogleEngineerController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const validatedData = clientApplyEngineerSchema.parse(req.body);
    const files = req.files as
      | {
          document?: { path: string }[];
          portfolio?: { path: string }[];
        }
      | undefined;
    const documentType = requireEngineerDocumentType(validatedData.documentType);
    const portfolioUrls = mapUploadedPaths(
      files?.portfolio as Express.Multer.File[] | undefined,
      "images",
    );
    const user = await completeGoogleEngineerRegistration(
      req.user!.userId,
      validatedData,
      uploadedDocumentUrl(req),
      documentType,
      portfolioUrls,
    );
    res.status(200).json(ApiResponse(200, "Engineer registration completed", user));
  } catch (error) {
    next(error);
  }
}

export async function loginController(req: Request, res: Response, next: NextFunction) {
  try {
    const validatedData = loginSchema.parse(req.body);
    const result = await login(validatedData);

    if ("token" in result) {
      if (result.user) {
        await logSystemEvent({
          actorId: result.user.id,
          actorRole: result.user.role,
          action: "auth.login",
          targetType: "User",
          targetId: String(result.user.id),
          ipAddress: req.ip,
          userAgent: req.get("User-Agent"),
        });
      }

      res.cookie("token", result.token, authCookieOptions(req.headers.origin));
      return res.status(200).json(ApiResponse(200, "Logged in successfully", result));
    }

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
    const result = await verifyEmail(token);
    res.cookie("token", result.token, authCookieOptions(req.headers.origin));
    res.status(200).json(ApiResponse(200, "Email verified successfully", result.user));
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
      req.query.role === "ENGINEER" ? ("ENGINEER" as const) : req.query.role === "CLIENT" ? ("CLIENT" as const) : undefined;
    const apiOrigin =
      typeof req.query.api_origin === "string" ? req.query.api_origin : undefined;
    const clientOrigin =
      typeof req.query.client_origin === "string"
        ? req.query.client_origin
        : undefined;
    const specialty =
      req.query.specialty === "CIVIL" || req.query.specialty === "ARCHITECTURAL"
        ? req.query.specialty
        : undefined;
    const bio = typeof req.query.bio === "string" ? req.query.bio : undefined;
    const nationality =
      typeof req.query.nationality === "string" ? req.query.nationality : undefined;
    const url = getGoogleAuthRedirectUrl({
      next,
      role,
      apiOrigin,
      clientOrigin,
      specialty,
      bio,
      nationality,
    });
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
      // Google redirects here without an Origin header — use the frontend origin
      // stored in OAuth state so cross-site cookies work (localhost ports + dev tunnels).
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


export async function googleCompleteRegistrationController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { token, role, specialty, bio, nationality } =
      googleCompleteRegistrationSchema.parse(req.body);
    const result = await completeGoogleRegistration(token, role, {
      specialty,
      bio,
      nationality,
    });
    
    // Set cookie
    res.cookie(
      "token",
      result.token,
      authCookieOptions(req.headers.origin),
    );

    res.status(200).json(ApiResponse(200, "Registration completed successfully", result.user));
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