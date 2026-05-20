"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Avatar, Badge, Card } from "@/components/UI";
import { IconSearch, IconPaperclip, IconSend, IconMore } from "@/components/Icons";
import { cn } from "@/utils/cn";
import { useI18n } from "@/i18n";
import useAuthStore from "@/store/authStore";
import {
  fetchConversations,
  fetchMessages,
  fetchConversationByProject,
  sendMessage as sendMessageApi,
} from "../api/messages.api";
import { useMessageSocket } from "../hooks/useMessageSocket";
import type { ChatMessage, ConversationListItem } from "../types";
import { DateSeparator } from "./DateSeparator";
import { MessageBubble } from "./MessageBubble";
import { ProjectContextPanel } from "./ProjectContextPanel";

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatMessageTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function isSameDay(a: string, b: string): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

function dayLabel(iso: string, todayLabel: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (isSameDay(iso, now.toISOString())) return todayLabel;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate()
  ) {
    return "Yesterday";
  }
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function MessagingPage() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);

  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadConversations = useCallback(async () => {
    setLoadingList(true);
    setListError(null);
    try {
      const list = await fetchConversations();
      setConversations(list);
      return list;
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setListError(err?.response?.data?.message ?? err?.message ?? "Failed to load inbox");
      return [];
    } finally {
      setLoadingList(false);
    }
  }, []);

  const loadMessages = useCallback(async (conversationId: number) => {
    setLoadingMessages(true);
    setSendError(null);
    try {
      const page = await fetchMessages(conversationId, 1, 100);
      setMessages(page.messages);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setSendError(err?.response?.data?.message ?? err?.message ?? "Failed to load messages");
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const handleNewSocketMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
    setConversations((prev) =>
      prev.map((c) =>
        c.id === msg.conversationId
          ? {
              ...c,
              lastMessage: msg.content,
              lastMessageAt: msg.createdAt,
            }
          : c,
      ),
    );
  }, []);

  const { onlineUsers, typingUserId, sendViaSocket, emitTypingStart, emitTypingStop } =
    useMessageSocket(activeId, handleNewSocketMessage);

  useEffect(() => {
    if (!user) return;
    loadConversations();
  }, [user, loadConversations]);

  // Open conversation from URL ?c= or ?project=
  useEffect(() => {
    if (!user) return;

    const convParam = searchParams.get("c");
    const projectParam = searchParams.get("project");

    async function resolveInitial() {
      if (convParam) {
        const id = Number(convParam);
        if (!Number.isNaN(id)) {
          setActiveId(id);
          router.replace("/messages", { scroll: false });
        }
        return;
      }

      if (projectParam) {
        try {
          const conv = await fetchConversationByProject(Number(projectParam));
          setActiveId(conv.id);
          await loadConversations();
          router.replace("/messages", { scroll: false });
        } catch {
          setListError("No conversation for this project yet. Accept a bid first.");
        }
        return;
      }
    }

    resolveInitial();
  }, [searchParams, user, router, loadConversations]);

  useEffect(() => {
    if (activeId == null) return;
    loadMessages(activeId);
  }, [activeId, loadMessages]);

  // Auto-select first conversation when list loads
  useEffect(() => {
    if (activeId != null || conversations.length === 0) return;
    if (searchParams.get("c") || searchParams.get("project")) return;
    setActiveId(conversations[0].id);
  }, [conversations, activeId, searchParams]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const activeConv = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId],
  );

  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter(
      (c) =>
        c.participantName.toLowerCase().includes(q) ||
        c.projectTitle.toLowerCase().includes(q) ||
        (c.lastMessage?.toLowerCase().includes(q) ?? false),
    );
  }, [conversations, search]);

  const groupedMessages = useMemo(() => {
    const groups: { label: string; items: ChatMessage[] }[] = [];
    for (const msg of messages) {
      const label = dayLabel(msg.createdAt, t("msg.today"));
      const last = groups[groups.length - 1];
      if (last?.label === label) {
        last.items.push(msg);
      } else {
        groups.push({ label, items: [msg] });
      }
    }
    return groups;
  }, [messages, t]);

  const handleSelect = (id: number) => {
    setActiveId(id);
    setDraft("");
    setSendError(null);
  };

  const handleDraftChange = (value: string) => {
    setDraft(value);
    if (!activeId) return;
    emitTypingStart();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => emitTypingStop(), 1500);
  };

  const handleSend = async () => {
    const content = draft.trim();
    if (!content || activeId == null || !user) return;

    setSending(true);
    setSendError(null);
    setDraft("");
    emitTypingStop();

    try {
      const { getMessageSocket } = await import("../lib/socket");
      if (getMessageSocket().connected) {
        sendViaSocket(content);
      } else {
        const msg = await sendMessageApi(activeId, content);
        handleNewSocketMessage(msg);
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setSendError(err?.response?.data?.message ?? err?.message ?? "Failed to send");
      setDraft(content);
    } finally {
      setSending(false);
    }
  };

  const participantOnline =
    activeConv != null && onlineUsers.has(activeConv.participantId);
  const isTyping =
    activeConv != null && typingUserId === activeConv.participantId;

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto py-20 text-center text-slate-500">
        <p>Sign in to view your messages.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-9rem)]">
      <Card className="h-full overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] lg:grid-cols-[300px_1fr_280px] h-full">
          {/* Inbox */}
          <aside className="border-e border-slate-200 dark:border-slate-800 flex flex-col min-h-0">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <h2 className="font-bold">{t("msg.inbox")}</h2>
              <div className="mt-3 relative">
                <IconSearch
                  width={14}
                  height={14}
                  className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  placeholder={t("msg.searchConv")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-9 ps-9 pe-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-electric-500/30"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              {loadingList ? (
                <p className="p-4 text-sm text-slate-500">Loading…</p>
              ) : listError ? (
                <p className="p-4 text-sm text-rose-500">{listError}</p>
              ) : filteredConversations.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-500">
                  <p className="font-medium">No conversations yet</p>
                  <p className="mt-2 text-xs">
                    A chat opens when a client accepts an engineer&apos;s bid on a project.
                  </p>
                </div>
              ) : (
                filteredConversations.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelect(m.id)}
                    className={cn(
                      "w-full p-3 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 text-start transition",
                      activeId === m.id
                        ? "bg-electric-500/5"
                        : "hover:bg-slate-50 dark:hover:bg-slate-900/50",
                    )}
                  >
                    <div className="relative shrink-0">
                      <Avatar name={m.participantName} size={42} />
                      {onlineUsers.has(m.participantId) && (
                        <span className="absolute bottom-0 end-0 h-3 w-3 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center gap-2">
                        <p className="text-sm font-semibold truncate">
                          {m.participantName}
                        </p>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {formatTime(m.lastMessageAt)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">
                        {m.projectTitle}
                      </p>
                      {m.lastMessage && (
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {m.lastMessage}
                        </p>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </aside>

          {/* Chat */}
          <main className="flex flex-col min-w-0 min-h-0">
            {activeConv ? (
              <>
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={activeConv.participantName} size={40} />
                    <div className="min-w-0">
                      <p className="font-semibold truncate">
                        {activeConv.participantName}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {activeConv.projectTitle}
                      </p>
                      {(participantOnline || isTyping) && (
                        <p className="text-xs text-emerald-500 flex items-center gap-1 mt-0.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          {isTyping ? t("msg.typing") : "Online"}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="h-9 w-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center shrink-0"
                    aria-label="More options"
                  >
                    <IconMore />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-1 bg-slate-50/50 dark:bg-slate-950/40 min-h-0">
                  {loadingMessages ? (
                    <p className="text-center text-sm text-slate-500">Loading messages…</p>
                  ) : messages.length === 0 ? (
                    <p className="text-center text-sm text-slate-500">
                      No messages yet. Say hello!
                    </p>
                  ) : (
                    groupedMessages.map((group) => (
                      <div key={group.label}>
                        <DateSeparator label={group.label} />
                        {group.items.map((msg) => {
                          const isMe = msg.senderId === user.id;
                          return (
                            <MessageBubble
                              key={msg.id}
                              side={isMe ? "me" : "them"}
                              name={msg.sender.name}
                              time={formatMessageTime(msg.createdAt)}
                            >
                              {msg.content}
                            </MessageBubble>
                          );
                        })}
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
                  {sendError && (
                    <p className="text-xs text-rose-500 mb-2 px-1">{sendError}</p>
                  )}
                  <div className="flex items-end gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 focus-within:ring-2 focus-within:ring-electric-500/30">
                    <button
                      type="button"
                      disabled
                      title="Attachments coming soon"
                      className="h-9 w-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 opacity-50 cursor-not-allowed"
                    >
                      <IconPaperclip width={16} height={16} />
                    </button>
                    <textarea
                      rows={1}
                      placeholder={t("msg.write")}
                      value={draft}
                      onChange={(e) => handleDraftChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      className="flex-1 bg-transparent text-sm focus:outline-none resize-none py-2 max-h-32"
                    />
                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={sending || !draft.trim()}
                      className="h-9 w-9 rounded-lg bg-electric-500 hover:bg-electric-400 disabled:opacity-50 text-white flex items-center justify-center shadow-md shadow-electric-500/30"
                    >
                      <IconSend width={16} height={16} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-sm p-8">
                {loadingList
                  ? "Loading…"
                  : "Select a conversation or accept a bid to start chatting."}
              </div>
            )}
          </main>

          <ProjectContextPanel conversation={activeConv} />
        </div>
      </Card>
    </div>
  );
}
