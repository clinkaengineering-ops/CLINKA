"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcastNewMessage = broadcastNewMessage;
exports.initSocket = initSocket;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const messages_service_1 = require("./modules/messages/messages.service");
const cors_1 = require("./config/cors");
// userId → Set of socketIds (user can have multiple tabs)
const onlineUsers = new Map();
let io = null;
function broadcastNewMessage(conversationId, message) {
    io?.to(`conv:${conversationId}`).emit("message:new", message);
}
function initSocket(httpServer) {
    const socketServer = new socket_io_1.Server(httpServer, {
        cors: {
            origin(origin, callback) {
                if ((0, cors_1.isAllowedOrigin)(origin)) {
                    callback(null, true);
                    return;
                }
                callback(new Error("CORS origin not allowed"));
            },
            credentials: true,
        },
    });
    // Auth middleware — read token from cookie or handshake auth
    io = socketServer;
    socketServer.use((socket, next) => {
        try {
            // Try handshake auth first (frontend sends it), then cookie
            const token = socket.handshake.auth?.token ||
                socket.handshake.headers?.cookie
                    ?.split("; ")
                    .find((c) => c.startsWith("token="))
                    ?.split("=")[1];
            if (!token)
                return next(new Error("Unauthorized"));
            const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            socket.user = payload;
            next();
        }
        catch {
            next(new Error("Unauthorized"));
        }
    });
    socketServer.on("connection", (socket) => {
        const user = socket.user;
        // Track online presence
        if (!onlineUsers.has(user.userId))
            onlineUsers.set(user.userId, new Set());
        onlineUsers.get(user.userId).add(socket.id);
        socketServer.emit("presence:update", { userId: user.userId, online: true });
        // Join a conversation room
        socket.on("conversation:join", (conversationId) => {
            socket.join(`conv:${conversationId}`);
        });
        // Leave a conversation room
        socket.on("conversation:leave", (conversationId) => {
            socket.leave(`conv:${conversationId}`);
        });
        // Send message via socket
        socket.on("message:send", async (data) => {
            try {
                const message = await (0, messages_service_1.sendMessage)(data.conversationId, user.userId, {
                    content: data.content,
                });
                // Broadcast to everyone in the room (including sender)
                broadcastNewMessage(data.conversationId, message);
            }
            catch (err) {
                socket.emit("error", { message: err.message });
            }
        });
        // Typing indicators
        socket.on("typing:start", (conversationId) => {
            socket.to(`conv:${conversationId}`).emit("typing:start", { userId: user.userId });
        });
        socket.on("typing:stop", (conversationId) => {
            socket.to(`conv:${conversationId}`).emit("typing:stop", { userId: user.userId });
        });
        // Disconnect
        socket.on("disconnect", () => {
            const sockets = onlineUsers.get(user.userId);
            if (sockets) {
                sockets.delete(socket.id);
                if (sockets.size === 0) {
                    onlineUsers.delete(user.userId);
                    socketServer.emit("presence:update", { userId: user.userId, online: false });
                }
            }
        });
    });
    return socketServer;
}
