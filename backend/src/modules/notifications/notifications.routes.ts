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
import { t3Limiters, t4AccountRateLimit } from "../../middlewares/rateLimit";

const router = Router();

router.use(authenticate);

router.get("/", t4AccountRateLimit, listNotificationsController);
router.get("/unread-count", t4AccountRateLimit, unreadCountController);
router.patch("/read-all", ...t3Limiters, markAllReadController);
router.patch("/:id/read", ...t3Limiters, markReadController);
router.get("/prefs", t4AccountRateLimit, getPrefsController);
router.put("/prefs", ...t3Limiters, updatePrefsController);

export default router;
