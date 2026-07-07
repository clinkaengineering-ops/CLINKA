"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Avatar, Badge, Card } from "@/components/UI";
import {
  IconSearch,
  IconPaperclip,
  IconSend,
  IconMore,
} from "@/components/Icons";
import { cn } from "@/utils/cn";
import { useI18n } from "@/i18n";
import useAuthStore from "@/store/authStore";
import {
  fetchConversations,
  fetchMessages,
  fetchConversationByProject,
  sendMessage as sendMessageApi,
  sendMessageWithAttachment,
} from "../api/messages.api";
import { useMessageSocket } from "../hooks/useMessageSocket";
import type { ChatMessage, ConversationListItem } from "../types";
import {
  parseApiValidation,
  sendMessageFormSchema,
  validateForm,
} from "@/lib/validation";
import { DateSeparator } from "../components/DateSeparator";
import { MessageBubble } from "../components/MessageBubble";
import { MessageAttachment } from "../components/MessageAttachment";
import { ProjectContextPanel } from "../components/ProjectContextPanel";
import {
  groupConversationsByParticipant,
  type ParticipantInboxGroup,
} from "../utils/groupConversations";

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

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const ACCEPTED_FILE_TYPES =
  "image/jpeg,image/png,image/gif,image/webp,application/pdf";

function messagePreview(msg: ChatMessage): string {
  const text = msg.content.trim();
  if (text) return text;
  if (msg.attachmentUrl) {
    return msg.attachmentName ? `📎 ${msg.attachmentName}` : "📎 Attachment";
  }
  return "";
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

  const [conversations, setConversations] = useState<ConversationListItem[]>(
    [],
  );
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [activeId, setActiveId] = useState<number | null>(null);
  const [activeParticipantId, setActiveParticipantId] = useState<number | null>(
    null,
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [banAlert, setBanAlert] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handledNavKeyRef = useRef<string | null>(null);
  const resolvingURLRef = useRef(false);

  const loadConversations = useCallback(async () => {
    setLoadingList(true);
    setListError(null);
    try {
      const list = await fetchConversations();
      setConversations(list);
      return list;
    } catch (e: unknown) {
      const err = e as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setListError(
        err?.response?.data?.message ?? err?.message ?? "Failed to load inbox",
      );
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
      const err = e as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setSendError(
        err?.response?.data?.message ??
          err?.message ??
          "Failed to load messages",
      );
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
              lastMessage: messagePreview(msg) || c.lastMessage,
              lastMessageAt: msg.createdAt,
            }
          : c,
      ),
    );
  }, []);

  const {
    onlineUsers,
    typingUserId,
    sendViaSocket,
    emitTypingStart,
    emitTypingStop,
  } = useMessageSocket(activeId, handleNewSocketMessage, (err) => {
    if (err.message.toLowerCase().includes("suspended")) {
      setBanAlert(err.message);
    } else {
      setSendError(err.message);
    }
  });

  const inboxGroups = useMemo(
    () => groupConversationsByParticipant(conversations),
    [conversations],
  );

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return inboxGroups;
    const q = search.toLowerCase();
    return inboxGroups.filter(
      (g) =>
        g.participantName.toLowerCase().includes(q) ||
        g.conversations.some(
          (c) =>
            c.projectTitle.toLowerCase().includes(q) ||
            (c.lastMessage?.toLowerCase().includes(q) ?? false),
        ),
    );
  }, [inboxGroups, search]);

  const activeGroup = useMemo(
    () =>
      inboxGroups.find((g) => g.participantId === activeParticipantId) ?? null,
    [inboxGroups, activeParticipantId],
  );

  useEffect(() => {
    if (!user) return;
    loadConversations();
  }, [user, loadConversations]);

  // Open conversation from URL ?c=, ?project=, or ?engineer=
  useEffect(() => {
    if (!user || loadingList || resolvingURLRef.current) return;

    const convParam = searchParams.get("c");
    const projectParam = searchParams.get("project");
    const engineerParam = searchParams.get("engineer");
    if (!convParam && !projectParam && !engineerParam) return;

    const navKey = `${convParam ?? ""}|${projectParam ?? ""}|${engineerParam ?? ""}`;
    if (handledNavKeyRef.current === navKey) return;
    handledNavKeyRef.current = navKey;

    async function resolveInitial() {
      resolvingURLRef.current = true;
      try {
        if (convParam) {
          const id = Number(convParam);
          if (!Number.isNaN(id)) {
            setActiveId(id);
            const match = conversations.find((c) => c.id === id);
            if (match) setActiveParticipantId(match.participantId);
          }
        } else if (engineerParam) {
          const engineerId = Number(engineerParam);
          if (!Number.isNaN(engineerId)) {
            const group = inboxGroups.find((g) => g.participantId === engineerId);
            if (group) {
              setActiveParticipantId(engineerId);
              setActiveId(group.conversations[0].id);
            } else {
              setListError(
                "No conversation yet. Post a project and wait for a bid, or open Messages after they bid on your project.",
              );
            }
          }
        } else if (projectParam) {
          try {
            const conv = await fetchConversationByProject(Number(projectParam));
            setActiveId(conv.id);
            setActiveParticipantId(
              conv.clientId === user!.id ? conv.engineerId : conv.clientId,
            );
            await loadConversations();
          } catch {
            setListError(
              "No conversation for this project yet. Wait for a bid or accept one to start chatting.",
            );
          }
        }
        // Cleanup URL after resolving
        router.replace("/messages", { scroll: false });
      } finally {
        resolvingURLRef.current = false;
      }
    }

    resolveInitial();
  }, [searchParams, user, router, loadConversations, loadingList, conversations, inboxGroups]);

  useEffect(() => {
    if (activeId == null) return;
    loadMessages(activeId);
  }, [activeId, loadMessages]);

  // Auto-select first participant thread when list loads
  useEffect(() => {
    if (activeId != null || inboxGroups.length === 0) return;
    if (
      searchParams.get("c") ||
      searchParams.get("project") ||
      searchParams.get("engineer")
    ) {
      return;
    }
    const first = inboxGroups[0];
    setActiveParticipantId(first.participantId);
    setActiveId(first.conversations[0].id);
  }, [inboxGroups, activeId, searchParams]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const activeConv = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId],
  );

  const todayLabel = t("msg.today");
  const groupedMessages = useMemo(() => {
    const groups: { label: string; items: ChatMessage[] }[] = [];
    for (const msg of messages) {
      const label = dayLabel(msg.createdAt, todayLabel);
      const last = groups[groups.length - 1];
      if (last?.label === label) {
        last.items.push(msg);
      } else {
        groups.push({ label, items: [msg] });
      }
    }
    return groups;
  }, [messages, todayLabel]);

  const handleSelectGroup = (group: ParticipantInboxGroup) => {
    setActiveParticipantId(group.participantId);
    setActiveId(group.conversations[0].id);
    setDraft("");
    setSendError(null);
  };

  const handleSelectProject = (conversationId: number) => {
    setActiveId(conversationId);
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setSendError("File must be 10 MB or smaller");
      return;
    }
    setSendError(null);
    setPendingFile(file);
  };

  const handleSend = async () => {
    if (activeId == null || !user) return;

    const hasFile = pendingFile != null;
    const trimmedDraft = draft.trim();

    if (!hasFile && !trimmedDraft) {
      setSendError("Message cannot be empty");
      return;
    }

    if (!hasFile) {
      const result = validateForm(sendMessageFormSchema, { content: draft });
      if (!result.success) {
        setSendError(result.errors.content ?? "Message cannot be empty");
        return;
      }
    }

    const content = trimmedDraft;
    const fileToSend = pendingFile;
    setSending(true);
    setSendError(null);
    setDraft("");
    setPendingFile(null);
    emitTypingStop();

    try {
      if (fileToSend) {
        const msg = await sendMessageWithAttachment(
          activeId,
          fileToSend,
          content || undefined,
        );
        handleNewSocketMessage(msg);
      } else {
        const { getMessageSocket } = await import("../lib/socket");
        if (getMessageSocket().connected) {
          sendViaSocket(content);
        } else {
          const msg = await sendMessageApi(activeId, content);
          handleNewSocketMessage(msg);
        }
      }
    } catch (e: unknown) {
      const { message } = parseApiValidation(e);
      if (message.toLowerCase().includes("suspended")) {
        setBanAlert(message);
      } else {
        setSendError(message);
      }
      setDraft(content);
      if (fileToSend) setPendingFile(fileToSend);
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
              ) : filteredGroups.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-500">
                  <p className="font-medium">No conversations yet</p>
                  <p className="mt-2 text-xs">
                    A chat opens when an engineer bids on your project (or when
                    you accept their bid).
                  </p>
                </div>
              ) : (
                filteredGroups.map((g) => (
                  <button
                    key={g.participantId}
                    type="button"
                    onClick={() => handleSelectGroup(g)}
                    className={cn(
                      "w-full p-3 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 text-start transition",
                      activeParticipantId === g.participantId
                        ? "bg-electric-500/5"
                        : "hover:bg-slate-50 dark:hover:bg-slate-900/50",
                    )}
                  >
                    <div className="relative shrink-0">
                      <Avatar name={g.participantName} size={42} />
                      {onlineUsers.has(g.participantId) && (
                        <span className="absolute bottom-0 end-0 h-3 w-3 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center gap-2">
                        <p className="text-sm font-semibold truncate">
                          {g.participantName}
                        </p>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {formatTime(g.lastMessageAt)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">
                        {g.conversations.length > 1
                          ? `${g.conversations.length} projects`
                          : g.conversations[0].projectTitle}
                      </p>
                      {g.lastMessage && (
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {g.lastMessage}
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
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 shrink-0 space-y-3">
                  <div className="flex items-center justify-between gap-3">
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
                  {activeGroup && activeGroup.conversations.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {activeGroup.conversations.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleSelectProject(c.id)}
                          className={cn(
                            "shrink-0 px-3 py-1 rounded-full text-xs border transition",
                            activeId === c.id
                              ? "bg-electric-500/15 border-electric-500/40 text-electric-700 dark:text-electric-300"
                              : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
                          )}
                        >
                          {c.projectTitle}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-1 bg-slate-50/50 dark:bg-slate-950/40 min-h-0">
                  {loadingMessages ? (
                    <p className="text-center text-sm text-slate-500">
                      Loading messages…
                    </p>
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
                              <MessageAttachment
                                message={msg}
                                side={isMe ? "me" : "them"}
                              />
                              {msg.content.trim() ? (
                                <p className="whitespace-pre-wrap break-words">
                                  {msg.content}
                                </p>
                              ) : null}
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
                    <p className="text-xs text-rose-500 mb-2 px-1">
                      {sendError}
                    </p>
                  )}
                  {pendingFile && (
                    <div className="mb-2 flex items-center gap-2 rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-2 text-sm">
                      <span className="truncate flex-1">
                        📎 {pendingFile.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPendingFile(null)}
                        className="text-xs text-slate-500 hover:text-rose-500 shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_FILE_TYPES}
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <div className="flex items-end gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 focus-within:ring-2 focus-within:ring-electric-500/30">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={sending}
                      title="Attach file (images or PDF, max 10 MB)"
                      className="h-9 w-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 disabled:opacity-50"
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
                      disabled={sending || (!draft.trim() && !pendingFile)}
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
                  : "Select a conversation or wait for a bid on your project to start chatting."}
              </div>
            )}
          </main>

          <ProjectContextPanel
            conversation={activeConv}
            onProjectUpdated={() => {
              void loadConversations();
            }}
          />
        </div>
      </Card>

      {banAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-6 text-center space-y-4 border border-slate-200 dark:border-slate-800 animate-scale-in">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 mb-2">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold">Account Suspended</h2>
            <p className="text-sm text-slate-500 whitespace-pre-wrap">{banAlert}</p>
            <p className="text-sm text-slate-500">If you believe this is a mistake or that you did not do anything wrong, please contact our support team to appeal this decision.</p>
            <div className="pt-4 flex flex-col gap-2">
              <Link href="/help" className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl bg-electric-500 hover:bg-electric-400 text-white font-semibold transition">
                Contact Support
              </Link>
              <button onClick={() => setBanAlert(null)} className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
