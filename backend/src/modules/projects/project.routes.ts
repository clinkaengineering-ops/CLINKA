import {Router} from "express";
import {
  createProjectController,
  deleteProjectController,
  getMyProjectsController,
  getProjectByIdController,
  getProjectsController,
  updateProjectController,
} from "./project.controller";
import { authenticate } from "../../middlewares/auth.middleware";

const router = Router();

router.post("/", authenticate, createProjectController);
router.get("/", getProjectsController);
router.get("/my", authenticate, getMyProjectsController);
router.get("/:id", getProjectByIdController);
router.put("/:id", authenticate, updateProjectController);
router.delete("/:id", authenticate, deleteProjectController);

export default router;