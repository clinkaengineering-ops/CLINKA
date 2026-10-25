import { Server as HttpServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import db from "./config/db";
import { sendMessage } from "./modules/messages/messages.service";
import { sendMessageSchema } from "./modules/messages/messages.validation";
import { isAllowedOrigin } from "./config/cors";
import { isTokenRevoked, isUserSessionRevoked } from "./utils/tokenRevocation";
import { isUserBanned } from "./modules/messages/ban.service";
import { T3_CHAT_MAX, T3_WINDOW_MS } from "./middlewares/rateLimit";

interface SocketUser {
  userId: string;
  role: string;
  iat?: number;
}

// userId → Set of socketIds (user can have multiple tabs)
const onlineUsers = new Map<string, Set<string>>();

// Join throttle: max 20 joins per 10s per socket
const socketJoinTimestamps = new Map<string, number[]>();
const WS_JOIN_WINDOW_MS = 10 * 1000;
const WS_JOIN_MAX = 20;

export function checkJoinRateLimit(socketId: string): boolean {
  const now = Date.now();
  const timestamps = socketJoinTimestamps.get(socketId) || [];
  const valid = timestamps.filter((ts) => now - ts < WS_JOIN_WINDOW_MS);
  if (valid.length >= WS_JOIN_MAX) {
    socketJoinTimestamps.set(socketId, valid);
    return false;
  }
  valid.push(now);
  socketJoinTimestamps.set(socketId, valid);
  return true;
}

// Message rate limit: matches HTTP t3ChatLimiters
const userMessageTimestamps = new Map<string, number[]>();
const WS_MESSAGE_WINDOW_MS = T3_WINDOW_MS;
const WS_MESSAGE_MAX = T3_CHAT_MAX;

export function checkMessageRateLimit(userId: string): boolean {
  const now = Date.now();
  const timestamps = userMessageTimestamps.get(userId) || [];
  const valid = timestamps.filter((ts) => now - ts < WS_MESSAGE_WINDOW_MS);
  if (valid.length >= WS_MESSAGE_MAX) {
    userMessageTimestamps.set(userId, valid);
    return false;
  }
  valid.push(now);
  userMessageTimestamps.set(userId, valid);
  return true;
}

let io: SocketServer | null = null;

export function broadcastNewMessage(conversationId: number, message: unknown) {
  io?.to(`conv:${conversationId}`).emit("message:new", message);
}

export async function socketAuthMiddleware(
  socket: { handshake: { auth?: { token?: string }; headers?: { cookie?: string } }; user?: unknown },
  next: (err?: Error) => void,
) {
  try {
    // Try handshake auth first (frontend sends it), then cookie
    let token = socket.handshake.auth?.token;
    if (!token && socket.handshake.headers?.cookie) {
      const match = socket.handshake.headers.cookie.match(/(?:^|;\s*)token=([^;]+)/);
      if (match) {
        token = decodeURIComponent(match[1]);
      }
    }

    if (!token) return next(new Error("Unauthorized"));

    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as SocketUser;
    if (!payload || !payload.userId) {
      return next(new Error("Unauthorized"));
    }

    if (await isTokenRevoked(token)) {
      return next(new Error("Token revoked"));
    }

    if (payload.iat && (await isUserSessionRevoked(payload.userId, payload.iat))) {
      return next(new Error("Session expired"));
    }

    const banStatus = await isUserBanned(payload.userId);
    if (banStatus.banned) {
      return next(new Error("User account is suspended"));
    }

    (socket as any).user = payload;
    next();
  } catch {
    next(new Error("Unauthorized"));
  }
}

export function initSocket(httpServer: HttpServer) {
  const socketServer = new SocketServer(httpServer, {
    cors: {
      origin(origin, callback) {
        if (isAllowedOrigin(origin)) {
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

  socketServer.use(socketAuthMiddleware);

  socketServer.on("connection", (socket: Socket) => {
    const user = (socket as any).user as SocketUser;

    // Track online presence
    if (!onlineUsers.has(user.userId)) onlineUsers.set(user.userId, new Set());
    onlineUsers.get(user.userId)!.add(socket.id);
    socketServer.emit("presence:update", { userId: user.userId, online: true });

    // Join a conversation room — ONLY if the user is a participant.
    // The optional `ack` callback tells the client the join is complete.
    socket.on(
      "conversation:join",
      async (conversationId: unknown, ack?: () => void) => {
        try {
          if (!checkJoinRateLimit(socket.id)) {
            socket.emit("error", { message: "Too many join requests. Please slow down." });
            return;
          }

          const id = Number(conversationId);
          if (!Number.isInteger(id) || id <= 0) return;

          const conv = await db.conversation.findUnique({
            where: { id },
            select: { clientId: true, engineerId: true },
          });
          if (!conv) return;

          const me = String(user.userId);
          if (conv.clientId !== me && conv.engineerId !== me) return;

          await socket.join(`conv:${id}`);
          if (typeof ack === "function") ack();
        } catch (err) {
          console.error("[socket] conversation:join failed", err);
        }
      },
    );

    // Leave a conversation room
    socket.on("conversation:leave", (conversationId: unknown) => {
      const id = Number(conversationId);
      if (Number.isInteger(id) && id > 0) socket.leave(`conv:${id}`);
    });

    // Send message via socket.
    // Messages from ONE socket are processed strictly one after another so they
    // are saved and broadcast in exactly the order the user sent them.
    let sendQueue: Promise<void> = Promise.resolve();

    socket.on("message:send", (data: { conversationId?: unknown; content?: unknown }) => {
      sendQueue = sendQueue.then(async () => {
        try {
          if (user.iat && (await isUserSessionRevoked(user.userId, user.iat))) {
            socket.emit("error", { message: "Session expired" });
            socket.disconnect(true);
            return;
          }

          if (!checkMessageRateLimit(user.userId)) {
            socket.emit("error", { message: "Too many messages sent. Please slow down." });
            return;
          }

          const conversationId = Number(data?.conversationId);
          if (!Number.isInteger(conversationId) || conversationId <= 0) {
            socket.emit("error", { message: "Invalid conversation" });
            return;
          }

          const parsed = sendMessageSchema.safeParse({
            content: typeof data?.content === "string" ? data.content : "",
          });
          if (!parsed.success) {
            socket.emit("error", {
              message: parsed.error.issues[0]?.message ?? "Invalid message",
            });
            return;
          }

          const message = await sendMessage(conversationId, user.userId, parsed.data);
          // Broadcast to everyone in the room (including sender)
          broadcastNewMessage(conversationId, message);
        } catch (err: any) {
          socket.emit("error", { message: err.message });
        }
      });
    });

    // Typing indicators
    socket.on("typing:start", (conversationId: unknown) => {
      const id = Number(conversationId);
      if (!Number.isInteger(id) || id <= 0) return;
      if (!socket.rooms.has(`conv:${id}`)) return;
      socket.to(`conv:${id}`).emit("typing:start", { userId: user.userId });
    });

    socket.on("typing:stop", (conversationId: unknown) => {
      const id = Number(conversationId);
      if (!Number.isInteger(id) || id <= 0) return;
      if (!socket.rooms.has(`conv:${id}`)) return;
      socket.to(`conv:${id}`).emit("typing:stop", { userId: user.userId });
    });

    // Disconnect
    socket.on("disconnect", () => {
      socketJoinTimestamps.delete(socket.id);
      const sockets = onlineUsers.get(user.userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(user.userId);
          userMessageTimestamps.delete(user.userId);
          socketServer.emit("presence:update", { userId: user.userId, online: false });
        }
      }
    });
  });

  return socketServer;
}