import { Server as HttpServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import db from "./config/db";
import { sendMessage } from "./modules/messages/messages.service";
import { sendMessageSchema } from "./modules/messages/messages.validation";
import { isAllowedOrigin } from "./config/cors";

interface SocketUser {
  userId: string;
  role: string;
}

// userId → Set of socketIds (user can have multiple tabs)
const onlineUsers = new Map<string, Set<string>>();

let io: SocketServer | null = null;

export function broadcastNewMessage(conversationId: number, message: unknown) {
  io?.to(`conv:${conversationId}`).emit("message:new", message);
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

  socketServer.use((socket, next) => {
    try {
      // Try handshake auth first (frontend sends it), then cookie
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.cookie
          ?.split("; ")
          .find((c: string) => c.startsWith("token="))
          ?.split("=")[1];

      if (!token) return next(new Error("Unauthorized"));

      const payload = jwt.verify(token, process.env.JWT_SECRET as string) as SocketUser;
      (socket as any).user = payload;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

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
    socket.on("typing:start", (conversationId: number) => {
      socket.to(`conv:${conversationId}`).emit("typing:start", { userId: user.userId });
    });

    socket.on("typing:stop", (conversationId: number) => {
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