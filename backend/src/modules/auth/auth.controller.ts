import { Request, Response, NextFunction } from "express";
import {
  changePasswordSchema,
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
  verifyOtp,
} from "./auth.service";
import ApiResponse from "../../utils/ApiResponse";
import multer from "multer";
import { AuthRequest } from "../../middlewares/auth.middleware";

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
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
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



export async function verifyOtpController(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, otp } = req.body;
    const result = await verifyOtp(userId, otp);

    res.cookie("token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 1000,
    });

    res.status(200).json(ApiResponse(200, "Logged in successfully", result.user));
  } catch (error) {
    next(error);
  }
}