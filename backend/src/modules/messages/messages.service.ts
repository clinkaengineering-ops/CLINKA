import db from "../../config/db";
import ApiError from "../../utils/ApiError";
import { createNotification } from "../../utils/notifications";
import { SendMessageInput } from "./messages.validation";
import { scanMessageContent } from "./content.scanner";
import { assertUserNotBanned, banUserFor30Days } from "./ban.service";
import { BanReason } from "../../generated/prisma/enums";

function formatLastMessagePreview(message: {
  content: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
}) {
  const text = message.content.trim();
  if (text) return text;
  if (message.attachmentUrl) {
    return message.attachmentName
      ? `📎 ${message.attachmentName}`
      : "📎 Attachment";
  }
  return null;
}

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
      projectTitle: conv.project?.title ?? "General Chat",
      projectStatus: conv.project?.status ?? "OPEN",
      participantId: other.id,
      participantName: other.name,
      participantAvatar: other.avatarUrl,
      lastMessage: lastMessage ? formatLastMessagePreview(lastMessage) : null,
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
  const content = (data.content ?? "").trim();
  const hasAttachment = Boolean(data.attachmentUrl);

  if (!content && !hasAttachment) {
    throw new ApiError(400, "Message must include text or a file");
  }

  const conv = await db.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conv) throw new ApiError(404, "Conversation not found");
  if (conv.clientId !== senderId && conv.engineerId !== senderId) {
    throw new ApiError(403, "Access denied");
  }

  await assertUserNotBanned(senderId, "send messages");

  if (content) {
    const scan = scanMessageContent(content);
    if (scan.flagged) {
      await banUserFor30Days(
        senderId,
        BanReason.CONTACT_INFO_SHARING,
        undefined,
        undefined,
        content,
      );
      throw new ApiError(
        403,
        `${scan.reason} Your account has been suspended for 30 days.`,
      );
    }
  }

  const message = await db.message.create({
    data: {
      conversationId,
      senderId,
      content,
      ...(hasAttachment && {
        attachmentUrl: data.attachmentUrl,
        attachmentName: data.attachmentName,
        attachmentMime: data.attachmentMime,
      }),
    },
    include: {
      sender: { select: { id: true, name: true, role: true } },
    },
  });

  const recipientId =
    conv.clientId === senderId ? conv.engineerId : conv.clientId;
  const project = conv.projectId
    ? await db.project.findUnique({
        where: { id: conv.projectId },
        select: { title: true },
      })
    : null;

  const preview =
    formatLastMessagePreview(message) ?? "New message";

  await createNotification(
    recipientId,
    "NEW_MESSAGE",
    "New message",
    preview.slice(0, 120),
    conv.projectId ? `/messages?project=${conv.projectId}` : `/messages?user=${senderId}`,
    {
      email: {
        senderName: message.sender.name,
        projectTitle: project?.title ?? "General Chat",
      },
    },
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

export async function getOrCreateGeneralConversation(
  initiatorId: number,
  targetUserId: number,
) {
  // Try to find an existing general conversation between these two
  let conv = await db.conversation.findFirst({
    where: {
      projectId: null,
      OR: [
        { clientId: initiatorId, engineerId: targetUserId },
        { clientId: targetUserId, engineerId: initiatorId },
      ],
    },
    include: {
      project: { select: { id: true, title: true, status: true } },
      client: { select: { id: true, name: true } },
      engineer: { select: { id: true, name: true } },
    },
  });

  if (!conv) {
    const target = await db.user.findUnique({ where: { id: targetUserId } });
    if (!target) throw new ApiError(404, "User not found");
    const initiator = await db.user.findUnique({ where: { id: initiatorId } });
    if (!initiator) throw new ApiError(404, "User not found");

    // Assign clientId to the initiator for simplicity in general chats
    conv = await db.conversation.create({
      data: {
        projectId: null,
        clientId: initiator.id,
        engineerId: target.id,
      },
      include: {
        project: { select: { id: true, title: true, status: true } },
        client: { select: { id: true, name: true } },
        engineer: { select: { id: true, name: true } },
      },
    });
  }

  return conv;
}