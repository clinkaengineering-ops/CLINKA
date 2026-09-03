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
  getMyOpenProjectsController,
} from "./project.controller";
import {
  inviteEngineerController,
  respondInvitationController,
  cancelInvitationController,
  getMyInvitationsController,
  getProjectInvitationsController,
  markInvitationViewedController,
} from "./invitation.controller";
import {
  authenticate,
  authorize,
  optionalAuthenticate,
  rejectIfBanned,
} from "../../middlewares/auth.middleware";
import deliverableUpload from "../../middlewares/deliverableUpload.middleware";
import { t2Limiters, t3Limiters, t4AccountRateLimit, t5PublicListingLimiter } from "../../middlewares/rateLimit";

const router = Router();

router.post("/", authenticate, ...t3Limiters, createProjectController);
router.get("/", optionalAuthenticate, t5PublicListingLimiter, getProjectsController);
router.get("/my", authenticate, t4AccountRateLimit, getMyProjectsController);
router.get("/my/open", authenticate, authorize("CLIENT"), t4AccountRateLimit, getMyOpenProjectsController);
router.get("/invitations", authenticate, authorize("ENGINEER"), t4AccountRateLimit, getMyInvitationsController);
router.patch("/invitations/:id/respond", authenticate, authorize("ENGINEER"), ...t3Limiters, respondInvitationController);
router.patch("/invitations/:id/view", authenticate, authorize("ENGINEER"), t4AccountRateLimit, markInvitationViewedController);
router.patch("/invitations/:invitationId/cancel", authenticate, authorize("CLIENT"), ...t3Limiters, cancelInvitationController);
router.get(
  "/assigned",
  authenticate,
  authorize("ENGINEER"),
  rejectIfBanned("ENGINEER"),
  t4AccountRateLimit,
  getAssignedProjectsController,
);
router.get("/:id", optionalAuthenticate, t5PublicListingLimiter, getProjectByIdController);
router.get("/:id/submissions", authenticate, t4AccountRateLimit, getProjectSubmissionsController);
router.get("/:id/invitations", authenticate, authorize("CLIENT"), t4AccountRateLimit, getProjectInvitationsController);
router.post("/:id/invite", authenticate, authorize("CLIENT"), ...t3Limiters, inviteEngineerController);
router.put("/:id", authenticate, ...t3Limiters, updateProjectController);
router.delete("/:id", authenticate, ...t3Limiters, deleteProjectController);

router.patch(
  "/:id/progress",
  authenticate,
  authorize("ENGINEER"),
  rejectIfBanned("ENGINEER"),
  ...t3Limiters,
  updateProjectProgressController,
);

router.post(
  "/:id/submit-work",
  authenticate,
  authorize("ENGINEER"),
  rejectIfBanned("ENGINEER"),
  ...t3Limiters,
  deliverableUpload.array("files", 10),
  submitProjectWorkController,
);

router.post(
  "/:id/request-revision",
  authenticate,
  authorize("CLIENT"),
  ...t3Limiters,
  requestProjectRevisionController,
);

router.post(
  "/:id/approve",
  authenticate,
  authorize("CLIENT"),
  ...t2Limiters,
  approveProjectWorkController,
);

router.patch(
  "/:id/finish",
  authenticate,
  authorize("ENGINEER"),
  rejectIfBanned("ENGINEER"),
  ...t3Limiters,
  markProjectFinishedController,
);

export default router;
