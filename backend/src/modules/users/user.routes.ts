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
import upload from "../../middlewares/upload.middleware";

const router = Router();

// Identity
router.get("/me", authenticate, getMeController);
router.put("/me", authenticate, updateMeController);
router.post("/me/avatar", authenticate, upload.single("image"), uploadAvatarController);
router.post(
  "/me/cover",
  authenticate,
  upload.single("image"),
  uploadCoverController,
);

// Engineer directory (public — no auth required to browse)
router.get("/engineers", getEngineersController);
router.get("/engineers/:id", getEngineerByIdController);

// Portfolio (engineer only — must be authenticated)
router.post(
  "/portfolio",
  authenticate,
  upload.single("image"),
  addPortfolioItemController,
);
router.delete("/portfolio/:id", authenticate, deletePortfolioItemController);

export default router;
