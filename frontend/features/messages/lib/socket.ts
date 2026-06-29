import { io, type Socket } from "socket.io-client";
import { resolveSocketBaseUrl } from "@/lib/apiBaseUrl";
import type { ChatMessage } from "../types";

let socket: Socket | null = null;

export function getSocketBaseUrl(): string {
  return resolveSocketBaseUrl();
}

export function getMessageSocket(): Socket {
  if (!socket) {
    socket = io(getSocketBaseUrl(), {
      withCredentials: true,
      autoConnect: false,
    });
  }
  return socket;
}

export function disconnectMessageSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export type PresenceUpdate = { userId: number; online: boolean };
export type TypingEvent = { userId: number };

export function subscribeSocketHandlers(
  sock: Socket,
  handlers: {
    onMessage?: (msg: ChatMessage) => void;
    onPresence?: (data: PresenceUpdate) => void;
    onTypingStart?: (data: TypingEvent) => void;
    onTypingStop?: (data: TypingEvent) => void;
    onError?: (err: { message: string }) => void;
  },
) {
  if (handlers.onMessage) sock.on("message:new", handlers.onMessage);
  if (handlers.onPresence) sock.on("presence:update", handlers.onPresence);
  if (handlers.onTypingStart) sock.on("typing:start", handlers.onTypingStart);
  if (handlers.onTypingStop) sock.on("typing:stop", handlers.onTypingStop);
  if (handlers.onError) sock.on("error", handlers.onError);
}

export function unsubscribeSocketHandlers(sock: Socket) {
  sock.off("message:new");
  sock.off("presence:update");
  sock.off("typing:start");
  sock.off("typing:stop");
  sock.off("error");
}
