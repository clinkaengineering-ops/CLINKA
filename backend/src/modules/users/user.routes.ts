// backend/features/users/user.routes.ts
import { Router } from "express";
import {
  getMeController,
  updateMeController,
  getEngineersController,
  getEngineerByIdController,
  addPortfolioItemController,
  deletePortfolioItemController,
  uploadAvatarController,
  uploadCoverController,
} from "./user.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import imageUpload from "../../middlewares/imageUpload.middleware";
import avatarUpload from "../../middlewares/avatarUpload.middleware";
import { t3Limiters, t4AccountRateLimit, t5PublicListingLimiter } from "../../middlewares/rateLimit";

const router = Router();

// Identity
router.get("/me", authenticate, t4AccountRateLimit, getMeController);
router.put("/me", authenticate, ...t3Limiters, updateMeController);
router.post("/me/avatar", authenticate, ...t3Limiters, avatarUpload.single("image"), uploadAvatarController);
router.post(
  "/me/cover",
  authenticate,
  ...t3Limiters,
  imageUpload.single("image"),
  uploadCoverController,
);

router.get("/engineers", t5PublicListingLimiter, getEngineersController);
router.get("/engineers/:id", t5PublicListingLimiter, getEngineerByIdController);

router.post(
  "/portfolio",
  authenticate,
  ...t3Limiters,
  imageUpload.single("image"),
  addPortfolioItemController,
);
router.delete("/portfolio/:id", authenticate, deletePortfolioItemController);

export default router;
