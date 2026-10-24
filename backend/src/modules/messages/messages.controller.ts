import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import {
  getMyConversations,
  getMessages,
  sendMessage,
  getConversationByProject,
  getUnreadMessagesCount,
  getOrCreateGeneralConversation,
} from "./messages.service";
import { sendMessageSchema } from "./messages.validation";
import ApiResponse from "../../utils/ApiResponse";
import ApiError from "../../utils/ApiError";
import {
  getStoredUploadPath,
  normalizeMimeType,
  deleteUploadFile,
} from "../../config/upload";
import { CHAT_MAX_VOICE_FILE_SIZE } from "../../middlewares/chatUpload.middleware";
import { broadcastNewMessage } from "../../socket";

export async function getMyConversationsController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await getMyConversations(String(req.user!.userId));
    res.status(200).json(ApiResponse(200, "Conversations fetched", data));
  } catch (error) {
    next(error);
  }
}

export async function getMessagesController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const conversationId = Number(req.params.id);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 30, 1), 100);
    const data = await getMessages(conversationId, String(req.user!.userId), page, limit);
    res.status(200).json(ApiResponse(200, "Messages fetched", data));
  } catch (error) {
    next(error);
  }
}

export async function sendMessageController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const file = req.file as Express.Multer.File | undefined;

  try {
    const conversationId = Number(req.params.id);

    if (file && file.size === 0) {
      throw new ApiError(400, "The selected file is empty (0 bytes). Please select a valid file.");
    }

    const normalizedMime = file ? normalizeMimeType(file.mimetype) : "";
    const isAudio = Boolean(
      normalizedMime && normalizedMime.startsWith("audio/"),
    );

    if (file && isAudio && file.size > CHAT_MAX_VOICE_FILE_SIZE) {
      throw new ApiError(
        400,
        "Audio file is too large. Maximum allowed size for voice messages is 5 MB.",
      );
    }

    const validatedData = sendMessageSchema.parse(req.body);

    if (isAudio && !validatedData.attachmentDuration) {
      throw new ApiError(400, "Duration is required for audio attachments");
    }

    const payload = {
      ...validatedData,
      ...(file && {
        attachmentUrl: getStoredUploadPath(file, "documents"),
        attachmentName: file.originalname,
        attachmentMime: normalizedMime,
      }),
      attachmentDuration: isAudio ? validatedData.attachmentDuration : null,
    };

    if (!payload.content?.trim() && !payload.attachmentUrl) {
      throw new ApiError(400, "Message must include text or a file");
    }

    const message = await sendMessage(conversationId, String(req.user!.userId), payload);
    broadcastNewMessage(conversationId, message);
    res.status(201).json(ApiResponse(201, "Message sent", message));
  } catch (error) {
    if (file?.path) {
      void deleteUploadFile(file.path);
    }
    next(error);
  }
}

export async function unreadMessagesCountController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const count = await getUnreadMessagesCount(String(req.user!.userId));
    res.status(200).json(ApiResponse(200, "OK", { count }));
  } catch (error) {
    next(error);
  }
}

export async function getConversationByProjectController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const projectId = (req.params.projectId as string);
    const data = await getConversationByProject(projectId, String(req.user!.userId));
    res.status(200).json(ApiResponse(200, "Conversation fetched", data));
  } catch (error) {
    next(error);
  }
}

export async function getGeneralConversationController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const targetUserId = (req.params.userId as string);
    const data = await getOrCreateGeneralConversation(String(req.user!.userId), targetUserId);
    res.status(200).json(ApiResponse(200, "Conversation fetched", data));
  } catch (error) {
    next(error);
  }
}