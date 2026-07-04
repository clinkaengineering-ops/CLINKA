"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyConversations = getMyConversations;
exports.getUnreadMessagesCount = getUnreadMessagesCount;
exports.markConversationRead = markConversationRead;
exports.getMessages = getMessages;
exports.sendMessage = sendMessage;
exports.markConversationReadOnFetch = markConversationReadOnFetch;
exports.getConversationByProject = getConversationByProject;
const db_1 = __importDefault(require("../../config/db"));
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
const notifications_1 = require("../../utils/notifications");
const content_scanner_1 = require("./content.scanner");
const ban_service_1 = require("./ban.service");
const enums_1 = require("../../generated/prisma/enums");
function formatLastMessagePreview(message) {
    const text = message.content.trim();
    if (text)
        return text;
    if (message.attachmentUrl) {
        return message.attachmentName
            ? `📎 ${message.attachmentName}`
            : "📎 Attachment";
    }
    return null;
}
function unreadCountForConv(conv, userId) {
    const isClient = conv.clientId === userId;
    const lastRead = isClient ? conv.clientLastReadAt : conv.engineerLastReadAt;
    return conv.messages.filter((m) => m.senderId !== userId &&
        (!lastRead || m.createdAt > lastRead)).length;
}
// Get all conversations for the current user (as client or engineer)
async function getMyConversations(userId) {
    const conversations = await db_1.default.conversation.findMany({
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
            lastMessage: lastMessage ? formatLastMessagePreview(lastMessage) : null,
            lastMessageAt: lastMessage?.createdAt ?? conv.createdAt,
            unread,
        };
    });
}
async function getUnreadMessagesCount(userId) {
    const conversations = await db_1.default.conversation.findMany({
        where: {
            OR: [{ clientId: userId }, { engineerId: userId }],
        },
        include: {
            messages: { orderBy: { createdAt: "desc" }, take: 50 },
        },
    });
    return conversations.reduce((sum, conv) => sum + unreadCountForConv(conv, userId), 0);
}
async function markConversationRead(conversationId, userId) {
    const conv = await db_1.default.conversation.findUnique({
        where: { id: conversationId },
    });
    if (!conv)
        throw new ApiError_1.default(404, "Conversation not found");
    if (conv.clientId !== userId && conv.engineerId !== userId) {
        throw new ApiError_1.default(403, "Access denied");
    }
    const now = new Date();
    if (conv.clientId === userId) {
        await db_1.default.conversation.update({
            where: { id: conversationId },
            data: { clientLastReadAt: now },
        });
    }
    else {
        await db_1.default.conversation.update({
            where: { id: conversationId },
            data: { engineerLastReadAt: now },
        });
    }
}
// Get paginated messages in a conversation
async function getMessages(conversationId, userId, page = 1, limit = 30) {
    // Verify user is a participant
    const conv = await db_1.default.conversation.findUnique({
        where: { id: conversationId },
    });
    if (!conv)
        throw new ApiError_1.default(404, "Conversation not found");
    if (conv.clientId !== userId && conv.engineerId !== userId) {
        throw new ApiError_1.default(403, "Access denied");
    }
    await markConversationRead(conversationId, userId);
    const [messages, total] = await Promise.all([
        db_1.default.message.findMany({
            where: { conversationId },
            include: {
                sender: { select: { id: true, name: true, role: true } },
            },
            orderBy: { createdAt: "asc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        db_1.default.message.count({ where: { conversationId } }),
    ]);
    return { messages, total, page, limit, totalPages: Math.ceil(total / limit) };
}
// Send a message
async function sendMessage(conversationId, senderId, data) {
    const content = (data.content ?? "").trim();
    const hasAttachment = Boolean(data.attachmentUrl);
    if (!content && !hasAttachment) {
        throw new ApiError_1.default(400, "Message must include text or a file");
    }
    const conv = await db_1.default.conversation.findUnique({
        where: { id: conversationId },
    });
    if (!conv)
        throw new ApiError_1.default(404, "Conversation not found");
    if (conv.clientId !== senderId && conv.engineerId !== senderId) {
        throw new ApiError_1.default(403, "Access denied");
    }
    await (0, ban_service_1.assertUserNotBanned)(senderId, "send messages");
    if (content) {
        const scan = (0, content_scanner_1.scanMessageContent)(content);
        if (scan.flagged) {
            await (0, ban_service_1.banUserFor30Days)(senderId, enums_1.BanReason.CONTACT_INFO_SHARING, undefined, undefined, content);
            throw new ApiError_1.default(403, `${scan.reason} Your account has been suspended for 30 days.`);
        }
    }
    const message = await db_1.default.message.create({
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
    const recipientId = conv.clientId === senderId ? conv.engineerId : conv.clientId;
    const project = await db_1.default.project.findUnique({
        where: { id: conv.projectId },
        select: { title: true },
    });
    const preview = formatLastMessagePreview(message) ?? "New message";
    await (0, notifications_1.createNotification)(recipientId, "NEW_MESSAGE", "New message", preview.slice(0, 120), `/messages?project=${conv.projectId}`, {
        email: {
            senderName: message.sender.name,
            projectTitle: project?.title ?? "a project",
        },
    });
    return message;
}
async function markConversationReadOnFetch(conversationId, userId) {
    await markConversationRead(conversationId, userId);
}
async function ensureConversationForProjectBid(projectId, engineerProfileId) {
    const existing = await db_1.default.conversation.findUnique({ where: { projectId } });
    if (existing)
        return existing;
    const project = await db_1.default.project.findUnique({ where: { id: projectId } });
    if (!project)
        return null;
    const engineerUser = await db_1.default.user.findFirst({
        where: { profile: { id: engineerProfileId } },
        select: { id: true },
    });
    if (!engineerUser)
        return null;
    return db_1.default.conversation.create({
        data: {
            projectId,
            clientId: project.clientId,
            engineerId: engineerUser.id,
        },
    });
}
// Get or return a conversation by projectId (used when opening chat from project page)
async function getConversationByProject(projectId, userId) {
    let conv = await db_1.default.conversation.findUnique({
        where: { projectId },
        include: {
            project: { select: { id: true, title: true, status: true } },
            client: { select: { id: true, name: true } },
            engineer: { select: { id: true, name: true } },
        },
    });
    if (!conv) {
        const project = await db_1.default.project.findUnique({
            where: { id: projectId },
            include: {
                bids: {
                    orderBy: { createdAt: "desc" },
                    include: { engineer: { select: { id: true, userId: true } } },
                },
            },
        });
        if (!project)
            throw new ApiError_1.default(404, "Project not found");
        const isClient = project.clientId === userId;
        const myBid = project.bids.find((b) => b.engineer.userId === userId);
        if (!isClient && !myBid) {
            throw new ApiError_1.default(403, "Access denied");
        }
        const bidForThread = project.bids.find((b) => b.status === "ACCEPTED") ??
            (isClient ? project.bids[0] : myBid);
        if (bidForThread) {
            const created = await ensureConversationForProjectBid(projectId, bidForThread.engineerId);
            if (created) {
                conv = await db_1.default.conversation.findUnique({
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
    if (!conv)
        throw new ApiError_1.default(404, "Conversation not found");
    if (conv.clientId !== userId && conv.engineerId !== userId) {
        throw new ApiError_1.default(403, "Access denied");
    }
    return conv;
}
