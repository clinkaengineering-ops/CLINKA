import { Router } from "express";
import {
  createProjectController,
  deleteProjectController,
  getAssignedProjectsController,
  getMyProjectsController,
  getProjectByIdController,
  getProjectsController,
  updateProjectController,
} from "./project.controller";
import {
  authenticate,
  authorize,
  optionalAuthenticate,
  rejectIfBanned,
} from "../../middlewares/auth.middleware";
import { markProjectFinishedController } from "./project.controller"; // add to existing import

const router = Router();

router.post("/", authenticate, createProjectController);
router.get("/", optionalAuthenticate, getProjectsController);
router.get("/my", authenticate, getMyProjectsController);
router.get(
  "/assigned",
  authenticate,
  authorize("ENGINEER"),
  rejectIfBanned("ENGINEER"),
  getAssignedProjectsController,
);
router.get("/:id", optionalAuthenticate, getProjectByIdController);
router.put("/:id", authenticate, updateProjectController);
router.delete("/:id", authenticate, deleteProjectController);

router.patch(
  "/:id/finish",
  authenticate,
  authorize("ENGINEER"),
  rejectIfBanned("ENGINEER"),
  markProjectFinishedController,
);

export default router;
