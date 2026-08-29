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

const router = Router();

router.get("/register/status", checkRegistrationEmailController);
router.post("/register/client", registerClientController);
router.post(
  "/register/engineer",
  upload.fields([{ name: "document", maxCount: 1 }]),
  imageUpload.array("portfolio", 10),
  registerEngineerController,
);
router.post(
  "/register/engineer/resume",
  imageUpload.array("portfolio", 10),
  resumeEngineerRegistrationController,
);
router.post(
  "/apply-engineer",
  authenticate,
  upload.fields([{ name: "document", maxCount: 1 }]),
  imageUpload.array("portfolio", 10),
  applyClientAsEngineerController,
);
router.post(
  "/register/engineer/google-complete",
  authenticate,
  upload.fields([{ name: "document", maxCount: 1 }]),
  imageUpload.array("portfolio", 10),
  completeGoogleEngineerController,
);
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
router.post("/google/complete-registration", googleCompleteRegistrationController);
router.get("/google", googleAuthStartController);
router.get("/google/callback", googleAuthCallbackController);

export default router;