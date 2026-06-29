import { Router } from "express";
import {
  approveProjectWorkController,
  createProjectController,
  deleteProjectController,
  getAssignedProjectsController,
  getMyProjectsController,
  getProjectByIdController,
  getProjectSubmissionsController,
  getProjectsController,
  markProjectFinishedController,
  requestProjectRevisionController,
  submitProjectWorkController,
  updateProjectController,
  updateProjectProgressController,
} from "./project.controller";
import {
  authenticate,
  authorize,
  optionalAuthenticate,
  rejectIfBanned,
} from "../../middlewares/auth.middleware";
import deliverableUpload from "../../middlewares/deliverableUpload.middleware";

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
router.get("/:id/submissions", authenticate, getProjectSubmissionsController);
router.put("/:id", authenticate, updateProjectController);
router.delete("/:id", authenticate, deleteProjectController);

router.patch(
  "/:id/progress",
  authenticate,
  authorize("ENGINEER"),
  rejectIfBanned("ENGINEER"),
  updateProjectProgressController,
);

router.post(
  "/:id/submit-work",
  authenticate,
  authorize("ENGINEER"),
  rejectIfBanned("ENGINEER"),
  deliverableUpload.array("files", 10),
  submitProjectWorkController,
);

router.post(
  "/:id/request-revision",
  authenticate,
  authorize("CLIENT"),
  requestProjectRevisionController,
);

router.post(
  "/:id/approve",
  authenticate,
  authorize("CLIENT"),
  approveProjectWorkController,
);

router.patch(
  "/:id/finish",
  authenticate,
  authorize("ENGINEER"),
  rejectIfBanned("ENGINEER"),
  markProjectFinishedController,
);

export default router;
