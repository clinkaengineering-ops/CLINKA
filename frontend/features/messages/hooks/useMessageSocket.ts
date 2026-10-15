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
  onError?: (err: { message: string }) => void,
  /** Called after the server confirmed we joined the room (also after every reconnect). */
  onJoined?: (conversationId: number) => void,
) {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUserId, setTypingUserId] = useState<string | null>(null);

  const onNewMessageRef = useRef(onNewMessage);
  const onErrorRef = useRef(onError);
  const onJoinedRef = useRef(onJoined);

  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
    onErrorRef.current = onError;
    onJoinedRef.current = onJoined;
  });

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
      onError: (err: { message: string }) => {
        onErrorRef.current?.(err);
      },
    };

    subscribeSocketHandlers(sock, handlers);

    return () => {
      unsubscribeSocketHandlers(sock, handlers);
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

  // Join the room; once the server confirms, ask the page to re-sync history.
  // This runs again after every reconnect, so messages missed while offline are recovered.
  useEffect(() => {
    if (!connected || conversationId == null) return;
    const sock = getMessageSocket();
    let cancelled = false;

    sock.emit("conversation:join", conversationId, () => {
      if (!cancelled) onJoinedRef.current?.(conversationId);
    });

    return () => {
      cancelled = true;
      sock.emit("conversation:leave", conversationId);
    };
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
