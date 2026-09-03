import { Router } from "express";
import {
  registerClientController,
  registerEngineerController,
  applyClientAsEngineerController,
  completeGoogleEngineerController,
  resumeEngineerRegistrationController,
  checkRegistrationEmailController,
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
  googleCompleteRegistrationController,
} from "./auth.controller";
import upload from "../../middlewares/upload.middleware";
import imageUpload from "../../middlewares/imageUpload.middleware";
import { authenticate } from "../../middlewares/auth.middleware";
import {
  t1LoginLimiters,
  t1OtpLimiters,
  t1RegisterLimiters,
  t3Limiters,
} from "../../middlewares/rateLimit";

const router = Router();

router.get("/register/status", checkRegistrationEmailController);
router.post("/register/client", ...t1RegisterLimiters, registerClientController);
router.post(
  "/register/engineer",
  ...t1RegisterLimiters,
  upload.fields([{ name: "document", maxCount: 1 }]),
  imageUpload.array("portfolio", 10),
  registerEngineerController,
);
router.post(
  "/register/engineer/resume",
  ...t1RegisterLimiters,
  imageUpload.array("portfolio", 10),
  resumeEngineerRegistrationController,
);
router.post(
  "/apply-engineer",
  authenticate,
  ...t1RegisterLimiters,
  upload.fields([{ name: "document", maxCount: 1 }]),
  imageUpload.array("portfolio", 10),
  applyClientAsEngineerController,
);
router.post(
  "/register/engineer/google-complete",
  authenticate,
  ...t1RegisterLimiters,
  upload.fields([{ name: "document", maxCount: 1 }]),
  imageUpload.array("portfolio", 10),
  completeGoogleEngineerController,
);
router.post("/login", ...t1LoginLimiters, loginController);
router.post("/logout", authenticate, logoutController);
router.get("/verify-email", verifyEmailController);
router.post("/forgot-password", ...t1OtpLimiters, forgotPasswordController);
router.post("/reset-password", ...t1RegisterLimiters, resetPasswordController);
router.post("/resend-verification", authenticate, ...t1OtpLimiters, resendVerificationController);
router.post("/change-password", authenticate, ...t3Limiters, changePasswordController);
router.post("/request-email-change", authenticate, ...t1OtpLimiters, requestEmailChangeController);
router.post("/confirm-email-change", authenticate, ...t1OtpLimiters, confirmEmailChangeController);
router.post("/verify-otp", ...t1OtpLimiters, verifyOtpController);

router.get("/google/status", googleAuthStatusController);
router.post("/google/complete-registration", ...t1RegisterLimiters, googleCompleteRegistrationController);
router.get("/google", googleAuthStartController);
router.get("/google/callback", googleAuthCallbackController);

export default router;