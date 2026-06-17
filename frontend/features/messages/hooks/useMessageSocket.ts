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
          if (online && prev.has(userId)) return prev;
          if (!online && !prev.has(userId)) return prev;
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

  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const sock = getMessageSocket();
    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);

    sock.on("connect", handleConnect);
    sock.on("disconnect", handleDisconnect);
    setConnected(sock.connected);

    return () => {
      sock.off("connect", handleConnect);
      sock.off("disconnect", handleDisconnect);
    };
  }, []);

  useEffect(() => {
    const sock = getMessageSocket();
    if (!connected) return;

    if (conversationId != null) {
      sock.emit("conversation:join", conversationId);
      return () => {
        sock.emit("conversation:leave", conversationId);
      };
    }
  }, [conversationId, connected]);

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
    isConnected: connected,
  };
}
