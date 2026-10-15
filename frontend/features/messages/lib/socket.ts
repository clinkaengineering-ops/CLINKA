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

export type PresenceUpdate = { userId: string; online: boolean };
export type TypingEvent = { userId: string };

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

export function unsubscribeSocketHandlers(
  sock: Socket,
  handlers: {
    onMessage?: (msg: ChatMessage) => void;
    onPresence?: (data: PresenceUpdate) => void;
    onTypingStart?: (data: TypingEvent) => void;
    onTypingStop?: (data: TypingEvent) => void;
    onError?: (err: { message: string }) => void;
  },
) {
  if (handlers.onMessage) sock.off("message:new", handlers.onMessage);
  if (handlers.onPresence) sock.off("presence:update", handlers.onPresence);
  if (handlers.onTypingStart) sock.off("typing:start", handlers.onTypingStart);
  if (handlers.onTypingStop) sock.off("typing:stop", handlers.onTypingStop);
  if (handlers.onError) sock.off("error", handlers.onError);
}
