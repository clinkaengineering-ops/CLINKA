// backend/features/users/user.routes.ts
import { Router } from "express";
import {
  getMeController,
  updateMeController,
  getEngineersController,
  getEngineerByIdController,
  addPortfolioItemController,
  deletePortfolioItemController,
} from "./user.controller";
import { authenticate } from "../../middlewares/auth.middleware";

const router = Router();

// Identity
router.get("/me", authenticate, getMeController);
router.put("/me", authenticate, updateMeController);

// Engineer directory (public — no auth required to browse)
router.get("/engineers", getEngineersController);
router.get("/engineers/:id", getEngineerByIdController);

// Portfolio (engineer only — must be authenticated)
router.post("/portfolio", authenticate, addPortfolioItemController);
router.delete("/portfolio/:id", authenticate, deletePortfolioItemController);

export default router;
