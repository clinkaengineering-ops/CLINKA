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
            lastMessage: lastMessage?.content ?? null,
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
    const conv = await db_1.default.conversation.findUnique({
        where: { id: conversationId },
    });
    if (!conv)
        throw new ApiError_1.default(404, "Conversation not found");
    if (conv.clientId !== senderId && conv.engineerId !== senderId) {
        throw new ApiError_1.default(403, "Access denied");
    }
    const message = await db_1.default.message.create({
        data: {
            conversationId,
            senderId,
            content: data.content,
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
    await (0, notifications_1.createNotification)(recipientId, "NEW_MESSAGE", "New message", data.content.slice(0, 120), `/messages?project=${conv.projectId}`);
    return message;
}
async function markConversationReadOnFetch(conversationId, userId) {
    await markConversationRead(conversationId, userId);
}
// Get or return a conversation by projectId (used when opening chat from project page)
async function getConversationByProject(projectId, userId) {
    const conv = await db_1.default.conversation.findUnique({
        where: { projectId },
        include: {
            project: { select: { id: true, title: true, status: true } },
            client: { select: { id: true, name: true } },
            engineer: { select: { id: true, name: true } },
        },
    });
    if (!conv)
        throw new ApiError_1.default(404, "Conversation not found");
    if (conv.clientId !== userId && conv.engineerId !== userId) {
        throw new ApiError_1.default(403, "Access denied");
    }
    return conv;
}
