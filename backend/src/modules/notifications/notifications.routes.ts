import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import {
  getPrefsController,
  listNotificationsController,
  markAllReadController,
  markReadController,
  unreadCountController,
  updatePrefsController,
} from "./notifications.controller";

const router = Router();

router.use(authenticate);

router.get("/", listNotificationsController);
router.get("/unread-count", unreadCountController);
router.patch("/read-all", markAllReadController);
router.patch("/:id/read", markReadController);
router.get("/prefs", getPrefsController);
router.put("/prefs", updatePrefsController);

export default router;
