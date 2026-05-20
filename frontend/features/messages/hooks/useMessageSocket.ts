"use client";

import { useEffect, useRef, useState } from "react";
import {
  getMessageSocket,
  subscribeSocketHandlers,
  unsubscribeSocketHandlers,
  type PresenceUpdate,
  type TypingEvent,
} from "../lib/socket";
import type { ChatMessage } from "../types";

export function useMessageSocket(
  conversationId: number | null,
  onNewMessage: (msg: ChatMessage) => void,
) {
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());
  const [typingUserId, setTypingUserId] = useState<number | null>(null);
  const onNewMessageRef = useRef(onNewMessage);
  onNewMessageRef.current = onNewMessage;

  useEffect(() => {
    const sock = getMessageSocket();
    if (!sock.connected) sock.connect();

    const handlers = {
      onMessage: (msg: ChatMessage) => onNewMessageRef.current(msg),
      onPresence: ({ userId, online }: PresenceUpdate) => {
        setOnlineUsers((prev) => {
          const next = new Set(prev);
          if (online) next.add(userId);
          else next.delete(userId);
          return next;
        });
      },
      onTypingStart: ({ userId }: TypingEvent) => setTypingUserId(userId),
      onTypingStop: ({ userId }: TypingEvent) => {
        setTypingUserId((cur) => (cur === userId ? null : cur));
      },
    };

    subscribeSocketHandlers(sock, handlers);

    return () => {
      unsubscribeSocketHandlers(sock);
    };
  }, []);

  useEffect(() => {
    const sock = getMessageSocket();
    if (!sock.connected) return;

    if (conversationId != null) {
      sock.emit("conversation:join", conversationId);
      return () => {
        sock.emit("conversation:leave", conversationId);
      };
    }
  }, [conversationId]);

  const sendViaSocket = (content: string) => {
    if (conversationId == null) return;
    getMessageSocket().emit("message:send", { conversationId, content });
  };

  const emitTypingStart = () => {
    if (conversationId != null) getMessageSocket().emit("typing:start", conversationId);
  };

  const emitTypingStop = () => {
    if (conversationId != null) getMessageSocket().emit("typing:stop", conversationId);
  };

  return {
    onlineUsers,
    typingUserId,
    sendViaSocket,
    emitTypingStart,
    emitTypingStop,
    isConnected: getMessageSocket().connected,
  };
}
