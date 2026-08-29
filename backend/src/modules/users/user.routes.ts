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

const router = Router();

// Identity
router.get("/me", authenticate, getMeController);
router.put("/me", authenticate, updateMeController);
router.post("/me/avatar", authenticate, avatarUpload.single("image"), uploadAvatarController);
router.post(
  "/me/cover",
  authenticate,
  imageUpload.single("image"),
  uploadCoverController,
);

// Engineer directory (public — no auth required to browse)
router.get("/engineers", getEngineersController);
router.get("/engineers/:id", getEngineerByIdController);

// Portfolio (engineer only — must be authenticated)
router.post(
  "/portfolio",
  authenticate,
  imageUpload.single("image"),
  addPortfolioItemController,
);
router.delete("/portfolio/:id", authenticate, deletePortfolioItemController);

export default router;
