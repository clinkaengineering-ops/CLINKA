"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/UI";
import { IconSearch } from "@/components/Icons";
import { MessageBubble } from "@/features/messages/components/MessageBubble";
import { MessageAttachment } from "@/features/messages/components/MessageAttachment";
import type { ChatMessage } from "@/features/messages/types";
import {
  fetchAdminConversationMessages,
  fetchAdminConversations,
  type AdminConversationItem,
  type AdminChatMessage,
} from "../api/admin.api";

function axiosMessage(err: unknown): string {
  const e = err as { response?: { data?: { message?: string } }; message?: string };
  return e?.response?.data?.message ?? e?.message ?? "Request failed";
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function toChatMessage(msg: AdminChatMessage): ChatMessage {
  return {
    id: msg.id,
    conversationId: msg.conversationId,
    senderId: msg.senderId,
    content: msg.content,
    attachmentUrl: msg.attachmentUrl,
    attachmentName: msg.attachmentName,
    attachmentMime: msg.attachmentMime,
    createdAt: msg.createdAt,
    sender: msg.sender,
  };
}

export function AdminChatViewer() {
  const [conversations, setConversations] = useState<AdminConversationItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<AdminChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const loadConversations = useCallback(async () => {
    setLoadingList(true);
    setListError(null);
    try {
      const page = await fetchAdminConversations(1, 100);
      setConversations(page.conversations);
      setActiveId((prev) => prev ?? page.conversations[0]?.id ?? null);
    } catch (err) {
      setListError(axiosMessage(err));
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (activeId == null) return;
    let cancelled = false;
    setLoadingMessages(true);
    fetchAdminConversationMessages(activeId, 1, 100)
      .then((page) => {
        if (!cancelled) setMessages(page.messages);
      })
      .catch((err) => {
        if (!cancelled) setListError(axiosMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoadingMessages(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) =>
        c.clientName.toLowerCase().includes(q) ||
        c.engineerName.toLowerCase().includes(q) ||
        c.projectTitle.toLowerCase().includes(q),
    );
  }, [conversations, search]);

  const activeConv = conversations.find((c) => c.id === activeId) ?? null;

  return (
    <Card className="overflow-hidden h-[min(70vh,640px)] flex flex-col">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <h2 className="font-bold">Chat viewer</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Read-only access to all platform conversations
        </p>
      </div>

      <div className="flex flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[280px_1fr]">
        <aside className="border-e border-slate-200 dark:border-slate-800 flex flex-col min-h-0">
          <div className="p-3 border-b border-slate-200 dark:border-slate-800">
            <div className="relative">
              <IconSearch
                width={14}
                height={14}
                className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or project…"
                className="w-full h-9 ps-9 pe-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingList ? (
              <p className="p-4 text-sm text-slate-500">Loading…</p>
            ) : listError && conversations.length === 0 ? (
              <p className="p-4 text-sm text-rose-500">{listError}</p>
            ) : filtered.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">No conversations</p>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveId(c.id)}
                  className={`w-full text-start p-3 border-b border-slate-100 dark:border-slate-800 transition ${
                    activeId === c.id
                      ? "bg-electric-500/5"
                      : "hover:bg-slate-50 dark:hover:bg-slate-900/50"
                  }`}
                >
                  <p className="text-sm font-semibold truncate">{c.projectTitle}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {c.clientName} ↔ {c.engineerName}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 truncate">
                    {c.lastMessage ?? "No messages"} · {c.messageCount} msgs
                  </p>
                </button>
              ))
            )}
          </div>
        </aside>

        <main className="flex flex-col min-h-0 bg-slate-50/50 dark:bg-slate-950/40">
          {!activeConv ? (
            <p className="flex-1 flex items-center justify-center text-sm text-slate-500">
              Select a conversation
            </p>
          ) : (
            <>
              <div className="p-3 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
                <p className="font-semibold text-sm">{activeConv.projectTitle}</p>
                <p className="text-xs text-slate-500">
                  {activeConv.clientName} (client) · {activeConv.engineerName} (engineer)
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMessages ? (
                  <p className="text-center text-sm text-slate-500">Loading messages…</p>
                ) : messages.length === 0 ? (
                  <p className="text-center text-sm text-slate-500">No messages</p>
                ) : (
                  messages.map((msg) => {
                    const chat = toChatMessage(msg);
                    const isClient = msg.senderId === activeConv.clientId;
                    return (
                      <MessageBubble
                        key={msg.id}
                        side={isClient ? "them" : "me"}
                        name={msg.sender.name}
                        time={formatTime(msg.createdAt)}
                      >
                        <MessageAttachment message={chat} side={isClient ? "them" : "me"} />
                        {msg.content.trim() ? (
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        ) : null}
                      </MessageBubble>
                    );
                  })
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </Card>
  );
}
