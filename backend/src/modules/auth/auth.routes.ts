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
  getMeController,
  verifyOtpController,
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
router.get("/me", authenticate, getMeController);
router.post("/verify-otp", verifyOtpController);

export default router;