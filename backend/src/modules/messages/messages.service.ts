import db from "../../config/db";
import ApiError from "../../utils/ApiError";
import { SendMessageInput } from "./messages.validation";

// Get all conversations for the current user (as client or engineer)
export async function getMyConversations(userId: number) {
  const conversations = await db.conversation.findMany({
    where: {
      OR: [{ clientId: userId }, { engineerId: userId }],
    },
    include: {
      project: { select: { id: true, title: true, status: true } },
      client: { select: { id: true, name: true } },
      engineer: { select: { id: true, name: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1, // only last message for preview
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return conversations.map((conv) => {
    const isClient = conv.clientId === userId;
    const other = isClient ? conv.engineer : conv.client;
    const lastMessage = conv.messages[0] ?? null;

    return {
      id: conv.id,
      projectId: conv.projectId,
      projectTitle: conv.project.title,
      projectStatus: conv.project.status,
      participantId: other.id,
      participantName: other.name,
      lastMessage: lastMessage?.content ?? null,
      lastMessageAt: lastMessage?.createdAt ?? conv.createdAt,
    };
  });
}

// Get paginated messages in a conversation
export async function getMessages(
  conversationId: number,
  userId: number,
  page: number = 1,
  limit: number = 30,
) {
  // Verify user is a participant
  const conv = await db.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conv) throw new ApiError(404, "Conversation not found");
  if (conv.clientId !== userId && conv.engineerId !== userId) {
    throw new ApiError(403, "Access denied");
  }

  const [messages, total] = await Promise.all([
    db.message.findMany({
      where: { conversationId },
      include: {
        sender: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.message.count({ where: { conversationId } }),
  ]);

  return { messages, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// Send a message
export async function sendMessage(
  conversationId: number,
  senderId: number,
  data: SendMessageInput,
) {
  const conv = await db.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conv) throw new ApiError(404, "Conversation not found");
  if (conv.clientId !== senderId && conv.engineerId !== senderId) {
    throw new ApiError(403, "Access denied");
  }

  const message = await db.message.create({
    data: {
      conversationId,
      senderId,
      content: data.content,
    },
    include: {
      sender: { select: { id: true, name: true, role: true } },
    },
  });

  return message;
}

// Get or return a conversation by projectId (used when opening chat from project page)
export async function getConversationByProject(
  projectId: number,
  userId: number,
) {
  const conv = await db.conversation.findUnique({
    where: { projectId },
    include: {
      project: { select: { id: true, title: true, status: true } },
      client: { select: { id: true, name: true } },
      engineer: { select: { id: true, name: true } },
    },
  });

  if (!conv) throw new ApiError(404, "Conversation not found");
  if (conv.clientId !== userId && conv.engineerId !== userId) {
    throw new ApiError(403, "Access denied");
  }

  return conv;
}