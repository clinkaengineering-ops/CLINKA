import api from "@/lib/axios";
import type { ApiResponse } from "@/features/engineers/api/engineer.api";
import type {
  ConversationDetail,
  ConversationListItem,
  MessagesPage,
  ChatMessage,
} from "../types";

const unwrap = <T>(promise: Promise<{ data: ApiResponse<T> }>) =>
  promise.then((r) => r.data.data);

export const fetchUnreadMessagesCount = (): Promise<number> =>
  unwrap(api.get<ApiResponse<{ count: number }>>("/messages/unread-count")).then(
    (d) => d.count,
  );

/** GET /messages/conversations */
export const fetchConversations = (): Promise<ConversationListItem[]> =>
  unwrap(api.get<ApiResponse<ConversationListItem[]>>("/messages/conversations")).then(
    (d) => d ?? [],
  );

/** GET /messages/conversations/:id?page=&limit= */
export const fetchMessages = (
  conversationId: number,
  page = 1,
  limit = 50,
): Promise<MessagesPage> =>
  unwrap(
    api.get<ApiResponse<MessagesPage>>(`/messages/conversations/${conversationId}`, {
      params: { page, limit },
    }),
  );

/** POST /messages/conversations/:id — text only */
export const sendMessage = (
  conversationId: number,
  content: string,
): Promise<ChatMessage> =>
  unwrap(
    api.post<ApiResponse<ChatMessage>>(`/messages/conversations/${conversationId}`, {
      content,
    }),
  );

/** POST /messages/conversations/:id — file with optional caption */
export const sendMessageWithAttachment = (
  conversationId: number,
  file: File,
  content?: string,
  attachmentDuration?: number | null,
): Promise<ChatMessage> => {
  const form = new FormData();
  form.append("file", file);
  if (content?.trim()) form.append("content", content.trim());

  let durationToSend = attachmentDuration;
  if (durationToSend === undefined || durationToSend === null) {
    const match = file.name.match(/-dur(\d+)/i);
    if (match) {
      durationToSend = Number(match[1]);
    }
  }

  const isAudio =
    file.type?.toLowerCase().startsWith("audio/") ||
    /\.(webm|weba|ogg|opus|m4a|mp4|mp3|wav|aac)$/i.test(file.name);

  if (isAudio) {
    const dur = Math.max(1, Math.min(300, Math.round(durationToSend || 1)));
    form.append("attachmentDuration", String(dur));
  } else if (typeof durationToSend === "number" && durationToSend > 0) {
    form.append("attachmentDuration", String(Math.round(durationToSend)));
  }

  return unwrap(
    api.post<ApiResponse<ChatMessage>>(
      `/messages/conversations/${conversationId}`,
      form,
      {
        timeout: 180_000,
      },
    ),
  );
};

/** GET /messages/by-project/:projectId */
export const fetchConversationByProject = (
  projectId: string,
): Promise<ConversationDetail> =>
  unwrap(
    api.get<ApiResponse<ConversationDetail>>(`/messages/by-project/${projectId}`),
  );

/** GET /messages/general/:userId */
export const fetchGeneralConversation = (
  userId: string,
): Promise<ConversationDetail> =>
  unwrap(
    api.get<ApiResponse<ConversationDetail>>(`/messages/general/${userId}`),
  );
