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

router.get("/me", authenticate, getMeController);
router.put("/me", authenticate, updateMeController);

router.get("/engineers", getEngineersController);
router.get("/engineers/:id", getEngineerByIdController);

router.post("/portfolio", authenticate, addPortfolioItemController);
router.delete("/portfolio/:id", authenticate, deletePortfolioItemController);

export default router;
