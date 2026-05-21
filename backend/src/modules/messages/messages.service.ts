import db from "../../config/db";
import ApiError from "../../utils/ApiError";
import { createNotification } from "../../utils/notifications";
import { SendMessageInput } from "./messages.validation";

function unreadCountForConv(
  conv: {
    clientId: number;
    engineerId: number;
    clientLastReadAt: Date | null;
    engineerLastReadAt: Date | null;
    messages: { senderId: number; createdAt: Date }[];
  },
  userId: number,
) {
  const isClient = conv.clientId === userId;
  const lastRead = isClient ? conv.clientLastReadAt : conv.engineerLastReadAt;
  return conv.messages.filter(
    (m) =>
      m.senderId !== userId &&
      (!lastRead || m.createdAt > lastRead),
  ).length;
}

// Get all conversations for the current user (as client or engineer)
export async function getMyConversations(userId: number) {
  const conversations = await db.conversation.findMany({
    where: {
      OR: [{ clientId: userId }, { engineerId: userId }],
    },
    include: {
      project: { select: { id: true, title: true, status: true } },
      client: { select: { id: true, name: true, avatarUrl: true } },
      engineer: { select: { id: true, name: true, avatarUrl: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return conversations.map((conv) => {
    const isClient = conv.clientId === userId;
    const other = isClient ? conv.engineer : conv.client;
    const lastMessage = conv.messages[0] ?? null;

    const unread = unreadCountForConv(conv, userId);

    return {
      id: conv.id,
      projectId: conv.projectId,
      projectTitle: conv.project.title,
      projectStatus: conv.project.status,
      participantId: other.id,
      participantName: other.name,
      participantAvatar: other.avatarUrl,
      lastMessage: lastMessage?.content ?? null,
      lastMessageAt: lastMessage?.createdAt ?? conv.createdAt,
      unread,
    };
  });
}

export async function getUnreadMessagesCount(userId: number) {
  const conversations = await db.conversation.findMany({
    where: {
      OR: [{ clientId: userId }, { engineerId: userId }],
    },
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });

  return conversations.reduce(
    (sum, conv) => sum + unreadCountForConv(conv, userId),
    0,
  );
}

export async function markConversationRead(
  conversationId: number,
  userId: number,
) {
  const conv = await db.conversation.findUnique({
    where: { id: conversationId },
  });
  if (!conv) throw new ApiError(404, "Conversation not found");
  if (conv.clientId !== userId && conv.engineerId !== userId) {
    throw new ApiError(403, "Access denied");
  }

  const now = new Date();
  if (conv.clientId === userId) {
    await db.conversation.update({
      where: { id: conversationId },
      data: { clientLastReadAt: now },
    });
  } else {
    await db.conversation.update({
      where: { id: conversationId },
      data: { engineerLastReadAt: now },
    });
  }
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

  await markConversationRead(conversationId, userId);

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

  const recipientId =
    conv.clientId === senderId ? conv.engineerId : conv.clientId;
  const project = await db.project.findUnique({
    where: { id: conv.projectId },
    select: { title: true },
  });

  await createNotification(
    recipientId,
    "NEW_MESSAGE",
    "New message",
    data.content.slice(0, 120),
    `/messages?project=${conv.projectId}`,
  );

  return message;
}

export async function markConversationReadOnFetch(
  conversationId: number,
  userId: number,
) {
  await markConversationRead(conversationId, userId);
}

async function ensureConversationForProjectBid(
  projectId: number,
  engineerProfileId: number,
) {
  const existing = await db.conversation.findUnique({ where: { projectId } });
  if (existing) return existing;

  const project = await db.project.findUnique({ where: { id: projectId } });
  if (!project) return null;

  const engineerUser = await db.user.findFirst({
    where: { profile: { id: engineerProfileId } },
    select: { id: true },
  });
  if (!engineerUser) return null;

  return db.conversation.create({
    data: {
      projectId,
      clientId: project.clientId,
      engineerId: engineerUser.id,
    },
  });
}

// Get or return a conversation by projectId (used when opening chat from project page)
export async function getConversationByProject(
  projectId: number,
  userId: number,
) {
  let conv = await db.conversation.findUnique({
    where: { projectId },
    include: {
      project: { select: { id: true, title: true, status: true } },
      client: { select: { id: true, name: true } },
      engineer: { select: { id: true, name: true } },
    },
  });

  if (!conv) {
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        bids: {
          orderBy: { createdAt: "desc" },
          include: { engineer: { select: { id: true, userId: true } } },
        },
      },
    });
    if (!project) throw new ApiError(404, "Project not found");

    const isClient = project.clientId === userId;
    const myBid = project.bids.find((b) => b.engineer.userId === userId);
    if (!isClient && !myBid) {
      throw new ApiError(403, "Access denied");
    }

    const bidForThread =
      project.bids.find((b) => b.status === "ACCEPTED") ??
      (isClient ? project.bids[0] : myBid);

    if (bidForThread) {
      const created = await ensureConversationForProjectBid(
        projectId,
        bidForThread.engineerId,
      );
      if (created) {
        conv = await db.conversation.findUnique({
          where: { projectId },
          include: {
            project: { select: { id: true, title: true, status: true } },
            client: { select: { id: true, name: true } },
            engineer: { select: { id: true, name: true } },
          },
        });
      }
    }
  }

  if (!conv) throw new ApiError(404, "Conversation not found");
  if (conv.clientId !== userId && conv.engineerId !== userId) {
    throw new ApiError(403, "Access denied");
  }

  return conv;
}