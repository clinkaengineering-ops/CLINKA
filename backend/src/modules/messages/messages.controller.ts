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
import { getStoredUploadPath } from "../../config/upload";
import { broadcastNewMessage } from "../../socket";

export async function getMyConversationsController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await getMyConversations(req.user!.userId);
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
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 30;
    const data = await getMessages(conversationId, req.user!.userId, page, limit);
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
  try {
    const conversationId = Number(req.params.id);
    const validatedData = sendMessageSchema.parse(req.body);
    const file = req.file as Express.Multer.File | undefined;

    const payload = {
      ...validatedData,
      ...(file && {
        attachmentUrl: getStoredUploadPath(file, "documents"),
        attachmentName: file.originalname,
        attachmentMime: file.mimetype,
      }),
    };

    if (!payload.content?.trim() && !payload.attachmentUrl) {
      throw new ApiError(400, "Message must include text or a file");
    }

    const message = await sendMessage(conversationId, req.user!.userId, payload);
    broadcastNewMessage(conversationId, message);
    res.status(201).json(ApiResponse(201, "Message sent", message));
  } catch (error) {
    next(error);
  }
}

export async function unreadMessagesCountController(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const count = await getUnreadMessagesCount(req.user!.userId);
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
    const projectId = Number(req.params.projectId);
    const data = await getConversationByProject(projectId, req.user!.userId);
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
    const targetUserId = Number(req.params.userId);
    const data = await getOrCreateGeneralConversation(req.user!.userId, targetUserId);
    res.status(200).json(ApiResponse(200, "Conversation fetched", data));
  } catch (error) {
    next(error);
  }
}