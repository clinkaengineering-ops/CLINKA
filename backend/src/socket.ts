import { Server as HttpServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { sendMessage } from "./modules/messages/messages.service";
import { isAllowedOrigin } from "./config/cors";

interface SocketUser {
  userId: number;
  role: string;
}

// userId → Set of socketIds (user can have multiple tabs)
const onlineUsers = new Map<number, Set<string>>();

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

    // Join a conversation room
    socket.on("conversation:join", (conversationId: number) => {
      socket.join(`conv:${conversationId}`);
    });

    // Leave a conversation room
    socket.on("conversation:leave", (conversationId: number) => {
      socket.leave(`conv:${conversationId}`);
    });

    // Send message via socket
    socket.on(
      "message:send",
      async (data: { conversationId: number; content: string }) => {
        try {
          const message = await sendMessage(data.conversationId, user.userId, {
            content: data.content,
          });
          // Broadcast to everyone in the room (including sender)
          broadcastNewMessage(data.conversationId, message);
        } catch (err: any) {
          socket.emit("error", { message: err.message });
        }
      },
    );

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