import { Router } from "express";
import {
  authenticate,
  rejectIfBanned,
} from "../../middlewares/auth.middleware";
import { MulterError } from "multer";
import ApiError from "../../utils/ApiError";
import chatUpload from "../../middlewares/chatUpload.middleware";
import { t3ChatLimiters, t4AccountRateLimit } from "../../middlewares/rateLimit";
import {
  getMyConversationsController,
  getMessagesController,
  sendMessageController,
  getConversationByProjectController,
  unreadMessagesCountController,
  getGeneralConversationController,
} from "./messages.controller";

const router = Router();

router.use(authenticate, rejectIfBanned());

// GET  /api/messages/conversations
router.get("/conversations", t4AccountRateLimit, getMyConversationsController);
router.get("/unread-count", t4AccountRateLimit, unreadMessagesCountController);

router.get("/conversations/:id", t4AccountRateLimit, getMessagesController);

router.get("/general/:userId", t4AccountRateLimit, getGeneralConversationController);

router.post("/conversations/:id", ...t3ChatLimiters, (req, res, next) => {
  chatUpload.single("file")(req, res, (err) => {
    if (err) {
      if (err instanceof MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return next(
            new ApiError(
              400,
              "File is too large. Maximum allowed size for chat attachments is 50 MB.",
            ),
          );
        }
        return next(
          new ApiError(400, err.message || "File upload failed. Please try again."),
        );
      }

      if (err.message === "FILE_TYPE_BLOCKED_DANGEROUS") {
        return next(
          new ApiError(
            400,
            "File format not allowed. Executable and script files (.exe, .bat, .sh, .cmd, etc.) are blocked for security reasons.",
          ),
        );
      }

      if (err.message === "FILE_FORMAT_NOT_ALLOWED") {
        return next(
          new ApiError(
            400,
            "Unsupported file format. Allowed formats: Images, PDF, Office documents, Archives (.zip, .rar, .7z, etc.), and Engineering/CAD/BIM files (.dwg, .rvt, .ifc, etc.).",
          ),
        );
      }

      return next(err);
    }

    void sendMessageController(req, res, next);
  });
});

// GET  /api/messages/by-project/:projectId
router.get("/by-project/:projectId", t4AccountRateLimit, getConversationByProjectController);

export default router;