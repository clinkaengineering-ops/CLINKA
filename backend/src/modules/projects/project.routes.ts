import {Router} from "express";
import {
  createProjectController,
  deleteProjectController,
  getAssignedProjectsController,
  getMyProjectsController,
  getProjectByIdController,
  getProjectsController,
  updateProjectController,
} from "./project.controller";
import { authenticate, authorize } from "../../middlewares/auth.middleware";

const router = Router();

router.post("/", authenticate, createProjectController);
router.get("/", getProjectsController);
router.get("/my", authenticate, getMyProjectsController);
router.get(
  "/assigned",
  authenticate,
  authorize("ENGINEER"),
  getAssignedProjectsController,
);
router.get("/:id", getProjectByIdController);
router.put("/:id", authenticate, updateProjectController);
router.delete("/:id", authenticate, deleteProjectController);

export default router;