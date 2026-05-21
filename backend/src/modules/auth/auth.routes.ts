import { Router } from "express";
import {
  registerClientController,
  registerEngineerController,
  loginController,
  logoutController,
  verifyEmailController,
  forgotPasswordController,
  resetPasswordController,
  resendVerificationController,
  changePasswordController,
  confirmEmailChangeController,
  requestEmailChangeController,
  verifyOtpController,
  googleAuthStartController,
  googleAuthCallbackController,
  googleAuthStatusController,
} from "./auth.controller";
import upload from "../../middlewares/upload.middleware";
import { authenticate } from "../../middlewares/auth.middleware";

const router = Router();

router.post("/register/client", registerClientController);
router.post("/register/engineer", upload.single("document"), registerEngineerController);
router.post("/login", loginController);
router.post("/logout", authenticate, logoutController);
router.get("/verify-email", verifyEmailController);
router.post("/forgot-password", forgotPasswordController);
router.post("/reset-password", resetPasswordController);
router.post("/resend-verification", authenticate, resendVerificationController);
router.post("/change-password", authenticate, changePasswordController);
router.post("/request-email-change", authenticate, requestEmailChangeController);
router.post("/confirm-email-change", authenticate, confirmEmailChangeController);
router.post("/verify-otp", verifyOtpController);

router.get("/google/status", googleAuthStatusController);
router.get("/google", googleAuthStartController);
router.get("/google/callback", googleAuthCallbackController);

export default router;